
window.onload = function() {
    const BOARD_SIZE = 811;
    const PADDING = 10;
    const OUTER_PADDING = 10;
    const LINE_THICKNESS = 1;
    const DIMENSIONS_NUMBER = 40;

    const COLOR_OBSTACLE = '#131313';
    const COLOR_START = '#6fa739';
    const COLOR_DESTINATION = '#b71919';
    const COLOR_PATH = '#0a437c';
    const COLOR_REGULAR = '#ffffff';
    const COLOR_SHORTEST_PATH = '#0db787';

    const INFINITY_COST = 999;
    const REGULAR_COST = 1;


    var SPACE_FOR_CELLS = 0;
    var SCALE = calculcateScale(DIMENSIONS_NUMBER);

    var canvas = document.getElementById("canvas");
    canvas.height = 850;
    canvas.width  = 850;

    var context = canvas.getContext("2d");
    context.lineWidth = LINE_THICKNESS;

    const MODES = {
        'STARTING_POINT': 0,
        'DESTINATION_POINT': 1,
        'OBSTACLES' : 2,
        'COMPUTING' : 3,
        'IDLE': 4
    };

    var currentMode = MODES.IDLE;



    document.getElementById('set-obstacles-button').onclick = function() {
        currentMode = MODES.OBSTACLES;
    }

    document.getElementById('set-start-button').onclick = function() {
        currentMode = MODES.STARTING_POINT;
    }

    document.getElementById('set-destination-button').onclick = function() {
        currentMode = MODES.DESTINATION_POINT;
    }
    document.getElementById('start-button').onclick = function() {
        setComputingModeIfAllSet();
        if (currentMode === MODES.COMPUTING) {
            findPath();
        }
    }

    document.getElementById('canvas').onclick = function(event) {
        if (currentMode !== MODES.COMPUTING) {
            let xCor = event.clientX;
            let yCor = event.clientY;

            if (xCor > 780 || yCor > 780) return;

            let xIndex = 0;
            let yIndex = 0;

            for (var x = 0; x <= DIMENSIONS_NUMBER; x++) {
                let minBoundaryX = PADDING + OUTER_PADDING + x * SPACE_FOR_CELLS/DIMENSIONS_NUMBER;
                let maxBoundaryX = minBoundaryX + SPACE_FOR_CELLS/DIMENSIONS_NUMBER;

                if (xCor >= minBoundaryX && xCor <= maxBoundaryX) {
                    xIndex = x;
                }
            }

            for (var y = 0; y <= DIMENSIONS_NUMBER; y++) {
                let minBoundaryY = PADDING + OUTER_PADDING + y * SPACE_FOR_CELLS/DIMENSIONS_NUMBER;
                let maxBoundaryY = minBoundaryY + SPACE_FOR_CELLS/DIMENSIONS_NUMBER;

                if (yCor >= minBoundaryY && yCor <= maxBoundaryY) {
                    yIndex = y;
                }
            }

            if (currentMode === MODES.OBSTACLES) {
                setObstacle(xIndex,yIndex);
            }
            if (currentMode === MODES.DESTINATION_POINT) {
                setDestination(xIndex,yIndex);
            }
            if (currentMode === MODES.STARTING_POINT) {
                setStartingPoint(xIndex,yIndex);
            }
        }
    }



    function drawBoard(){
        for (var x = 0; x <= SPACE_FOR_CELLS; x += SCALE) {
            context.moveTo(x + PADDING + LINE_THICKNESS, PADDING);
            context.lineTo(x + PADDING + LINE_THICKNESS, SPACE_FOR_CELLS + PADDING);
        }

        for (var y = 0; y <= SPACE_FOR_CELLS; y += SCALE) {
            context.moveTo(PADDING, LINE_THICKNESS + y + PADDING);
            context.lineTo(SPACE_FOR_CELLS + PADDING, LINE_THICKNESS + y + PADDING);
        }

        context.strokeStyle = "black";
        context.stroke();
    }

    function calculcateScale(dimensionsNumber)
    {
        SPACE_FOR_CELLS = BOARD_SIZE - PADDING - ((dimensionsNumber + 1) * LINE_THICKNESS);
        return SPACE_FOR_CELLS/dimensionsNumber;
    }

    function paintCell(positionX, positionY, color)
    {
        let calculatedPositionX = PADDING + positionX * SCALE + LINE_THICKNESS;
        let calculatedPositionY = PADDING  + positionY * SCALE + LINE_THICKNESS;

        context.beginPath();
        context.fillStyle = color;
        context.fillRect(calculatedPositionX + LINE_THICKNESS, calculatedPositionY + LINE_THICKNESS, SCALE - LINE_THICKNESS*2, SCALE - LINE_THICKNESS*2);
        context.stroke();
    }

    function createNode(x = null, y = null, isDestination = false, isStartingPoint = false, cost = REGULAR_COST)
    {
        let node = {
            visited: false,
            cost: cost,
            isDestination: isDestination,
            isStartingPoint: isStartingPoint,
            x: x,
            y: y
        };
        return JSON.parse(JSON.stringify(node));
    }

    function initNodes (unvisitedNodes)
    {
        for (var x = 0; x < DIMENSIONS_NUMBER; x++) {
            for (var y = 0; y < DIMENSIONS_NUMBER; y++) {
                unvisitedNodes.push(createNode(x, y, false, false));
            }
        }
    }

    drawBoard();

    let unvisitedNodes = [];
    initNodes(unvisitedNodes);

    document.getElementById('debug-button').onclick = function() {
        if (unvisitedNodes) {
            console.log(unvisitedNodes);
        }
    }

    function setObstacle (x,y) {
        unvisitedNodes.forEach(function (node, index) {
            if (node.x === x && node.y === y) {
                unvisitedNodes[index] = createNode(x,y,false,false, INFINITY_COST);
            }
        });
        paintCell(x,y, COLOR_OBSTACLE);
    }

    function setDestination (xIndex,yIndex) {
        unvisitedNodes.forEach(function (node, index) {
            if (node.isDestination && node.x !== xIndex && node.y !== yIndex) { //reset old destination
                unvisitedNodes[index] = createNode(node.x, node.y, false, false, REGULAR_COST);
                paintCell(node.x, node.y, COLOR_REGULAR);
            }
            if (node.x === xIndex && node.y === yIndex) {
                unvisitedNodes[index] = createNode(xIndex, yIndex, true, false, REGULAR_COST);
            }
        });
        paintCell(xIndex,yIndex, COLOR_DESTINATION);
    }

    function setStartingPoint (xIndex,yIndex) {
        unvisitedNodes.forEach(function (node, index) {
            if (node.isStartingPoint && node.x !== xIndex && node.y !== yIndex) { //reset old starting point
                unvisitedNodes[index] = createNode(node.x, node.y, false, false, REGULAR_COST);
                paintCell(node.x, node.y, COLOR_REGULAR);
            }
            if (node.x === xIndex && node.y === yIndex) {
                unvisitedNodes[index] = createNode(xIndex, yIndex, false, true, REGULAR_COST);
            }
        });
        paintCell(xIndex,yIndex, COLOR_START);
    }

    function setComputingModeIfAllSet()
    {
        let isStartSet = false;
        let isDestSet = false;

        unvisitedNodes.forEach(function (node) {
            if (node.isStartingPoint) isStartSet = true;
            if (node.isDestination) isDestSet = true;
        });

        if (isDestSet && isStartSet) {
            currentMode = MODES.COMPUTING;
        } else {
            if (isStartSet && !isDestSet) {
                alert('Set destination point at first.')
            }
            if (!isStartSet && isDestSet) {
                alert('Set starting point at first.')
            }
            if (!isStartSet && !isDestSet) {
                alert('Set starting and destination point at first.')
            }
        }
    }

    let heap = [];
    function initHeap(heap)
    {
        unvisitedNodes.forEach(function(node) {
            if (node.isStartingPoint) {
                heap.push(
                    {
                        node: node,
                        shortestDistanceFromStart: 0,
                        previousNode: null,
                    }
                )
            } else {
                heap.push(
                    {
                        node: node,
                        shortestDistanceFromStart: INFINITY_COST,
                        previousNode: null,
                    }
                )
            }
        });
    }

    function findPath() {
        initHeap(heap);
        let currentNode = getRootNodeReference();

        let timeout = 0;
        while (true) {
            timeout++;
            let unvisitedNeighbours = getCurrentNodeUnvisitedNeighbours(currentNode.x, currentNode.y);
            calculateTentativeDistances(currentNode, unvisitedNeighbours);

            if (currentNode.isDestination) {
                let shortestPathDistance = getHeapMapReference(currentNode.x, currentNode.y).shortestDistanceFromStart;
                setTimeout(drawShortestPath, timeout * 10, currentNode);
                setTimeout(appendShortestPathResult, (timeout + 1) * 10, shortestPathDistance);
                break;
            }

            currentNode.visited = true;
            if (!currentNode.isStartingPoint) {
                setTimeout(paintCell, timeout * 10, currentNode.x, currentNode.y, COLOR_PATH);
            }

            removeNodeFromUnvisited(currentNode);
            currentNode = selectNextToVisit();
        }
    }

    function appendShortestPathResult(shortestPath)
    {
        var div = document.getElementById('result');
        div.innerHTML += Math.round(shortestPath * 100) / 100;
    }

    function drawShortestPath(destinationNode)
    {
        let node = destinationNode;
        let timeout = 0;
        while (!node.isStartingPoint) {
            timeout++;
            let heatMap = getHeapMapReference(node.x, node.y);
            let previousNode = heatMap.previousNode;
            if (!previousNode.isStartingPoint) {
                setTimeout(paintCell, timeout * 10, previousNode.x, previousNode.y, COLOR_SHORTEST_PATH);
            }
            node = previousNode;
        }
    }

    function selectNextToVisit() {
        let heapMapWithMinDist = heap[0];
        heap.forEach(function(heapMap) {
            let dist = heapMap.shortestDistanceFromStart;
            if (dist < heapMapWithMinDist.shortestDistanceFromStart && !heapMap.node.visited && heapMap.node.cost < INFINITY_COST) {
                heapMapWithMinDist = heapMap;
            }
        });
        //handle case when all visited
        return heapMapWithMinDist.node;
    }

    function calculateTentativeDistances(currentNode, unvisitedNeighbours)
    {
        unvisitedNeighbours.forEach(function (unvisitedNeighbour) {
            let distance = calculateDistanceFromRootNode(currentNode, unvisitedNeighbour);
            let heatMapForUnvisitedNeighbour = getHeapMapReference(unvisitedNeighbour.x, unvisitedNeighbour.y);

            if (distance < heatMapForUnvisitedNeighbour.shortestDistanceFromStart) {
                heatMapForUnvisitedNeighbour.shortestDistanceFromStart = distance;
                heatMapForUnvisitedNeighbour.previousNode = currentNode;
            }
        });
    }

    function calculateDistanceFromRootNode(currentNode, consideredNode) {
        let distanceFromPreviousNode = Math.sqrt(Math.pow((consideredNode.x - currentNode.x),2) + Math.pow((consideredNode.y - currentNode.y),2));
        let heapMapForCurrentNode = getHeapMapReference(currentNode.x, currentNode.y);
        return heapMapForCurrentNode.shortestDistanceFromStart + distanceFromPreviousNode;
    }

    function getCurrentNodeUnvisitedNeighbours(x, y) {
        let neighboursCoordinates = [
            {
                "x": x - 1,
                "y": y - 1,
            },
            {
                "x": x,
                "y": y - 1,
            },
            {
                "x": x + 1,
                "y": y - 1,
            },
            {
                "x": x - 1,
                "y": y,
            },
            {
                "x": x + 1,
                "y": y,
            },
            {
                "x": x - 1,
                "y": y + 1,
            },
            {
                "x": x,
                "y": y + 1,
            },
            {
                "x": x + 1,
                "y": y + 1,
            }
        ];

        let unvisitedNeighbours = [];
        neighboursCoordinates.forEach(function (cords) {
            if (isCoordinateValid(cords.x) && isCoordinateValid(cords.y)) {
                let node = getNodeReference(cords.x, cords.y);
                if (node !== null && node !== undefined && !node.visited) {
                    unvisitedNeighbours.push(
                        getNodeReference(cords.x, cords.y),
                    );
                }
            }
        });
        return unvisitedNeighbours;
    }

    function isCoordinateValid (cord) {
        return cord >= 0 && cord <= 39;
    }

    function removeNodeFromUnvisited(node)
    {
        for(var i = 0; i < unvisitedNodes.length; i++) {
            if (unvisitedNodes[i].x === node.x && unvisitedNodes[i].y === node.y) {
                unvisitedNodes.splice(i, 1);
            }
        }
    }

    function getNodeReference(x, y) {
        for(var i = 0; i < unvisitedNodes.length; i++) {
            if (unvisitedNodes[i].x === x && unvisitedNodes[i].y === y) {
                return unvisitedNodes[i];
            }
        }

    }

    function getRootNodeReference() {
        for(var i = 0; i < unvisitedNodes.length; i++) {
            if (unvisitedNodes[i].isStartingPoint) {
                return unvisitedNodes[i];
            }
        }
    }

    function getHeapMapReference(x, y)
    {
        for(var i = 0; i < heap.length; i++) {
            if (heap[i].node.x === x && heap[i].node.y === y) {
                return heap[i];
            }
        }
    }
};



