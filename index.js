
window.onload = function() {
    const PADDING = 10;
    const OUTER_PADDING = 8;
    const LINE_THICKNESS = 1;
    const DIMENSIONS_NUMBER = 40;

    const SCALE = 19;

    const COLOR_OBSTACLE = '#131313';
    const COLOR_START = '#6fa739';
    const COLOR_DESTINATION = '#b71919';
    const COLOR_PATH = '#0a437c';
    const COLOR_REGULAR = '#ffffff';
    const COLOR_SHORTEST_PATH = '#0db787';

    const INFINITY_COST = 999999;
    const REGULAR_COST = 1;

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

    const AVAILABLE_ALGORITHMS = {
        'DIJKSTRA': 0,
        'A_STAR': 1
    };

    let SELECTED_ALGORITHM = AVAILABLE_ALGORITHMS.A_STAR;

    let DESTINATION_VERTEX_COORDINATES = {
        x: null,
        y: null
    }

    let currentMode = MODES.IDLE;

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

            let gridPoint = resolveGridPointFromClickEvent(event);

            if (currentMode === MODES.DESTINATION_POINT) {
                setDestination(gridPoint.x, gridPoint.y);
            }
            if (currentMode === MODES.STARTING_POINT) {
                setStartingPoint(gridPoint.x, gridPoint.y);
            }
        }
    }

    function resolveGridPointFromClickEvent(clickEvent)
    {
        let xCor = clickEvent.clientX;
        let yCor = clickEvent.clientY;
        if (!isClickCoordinateInsideCanvas(xCor, yCor)) return;

        let xIndex = 0;
        let yIndex = 0;

        for (var x = 0; x <= DIMENSIONS_NUMBER; x++) {
            let minBoundaryX = OUTER_PADDING + PADDING + (x * SCALE) + (x+1) * LINE_THICKNESS;
            let maxBoundaryX = minBoundaryX + SCALE;

            if (xCor >= minBoundaryX && xCor <= maxBoundaryX) {
                xIndex = x;
            }
        }

        for (var y = 0; y <= DIMENSIONS_NUMBER; y++) {
            let minBoundaryY = OUTER_PADDING + PADDING + (y * SCALE) + (y+1) * LINE_THICKNESS;
            let maxBoundaryY = minBoundaryY + SCALE;

            if (yCor >= minBoundaryY && yCor <= maxBoundaryY) {
                yIndex = y;
            }
        }

        return {
            x: xIndex,
            y: yIndex,
        }
    }


    canvas.addEventListener('mousemove', handleMouseMove, false);
    canvas.addEventListener('mousedown', handleMouseDown, false);
    canvas.addEventListener('mouseup', handleMouseUp, false);

    let clicked = false;
    function handleMouseDown(event) {
        clicked = true;
    }

    function isClickCoordinateInsideCanvas(clientX, clientY)
    {
        let boundary = OUTER_PADDING + PADDING + DIMENSIONS_NUMBER * SCALE + DIMENSIONS_NUMBER * LINE_THICKNESS;
        return !(clientX > boundary || clientY > boundary);
    }

    function handleMouseMove(event)
    {
        if (clicked) {
            if (currentMode !== MODES.COMPUTING) {
                let gridPoint = resolveGridPointFromClickEvent(event);

                if (currentMode === MODES.OBSTACLES) {
                    setObstacle(gridPoint.x, gridPoint.y);
                }
            }

        }
    }

    function handleMouseUp(event)
    {
        clicked = false;
    }


    function drawBoard(){
        for (var x = 0; x <= DIMENSIONS_NUMBER; x++) {
            context.moveTo((PADDING + (x * SCALE)) + x * LINE_THICKNESS, PADDING);
            context.lineTo((PADDING + (x * SCALE)) + x * LINE_THICKNESS, PADDING + (DIMENSIONS_NUMBER * SCALE) + LINE_THICKNESS * (DIMENSIONS_NUMBER + 1));
        }

        for (var y = 0; y <= DIMENSIONS_NUMBER; y++) {
            context.moveTo(PADDING, (PADDING + (y * SCALE)) + y * LINE_THICKNESS);
            context.lineTo(PADDING + (DIMENSIONS_NUMBER * SCALE) + LINE_THICKNESS * (DIMENSIONS_NUMBER + 1), (PADDING + (y * SCALE)) + y * LINE_THICKNESS);
        }

        context.strokeStyle = "black";
        context.stroke();
    }

    function paintCell(positionX, positionY, color)
    {
        let calculatedPositionX = PADDING + positionX * SCALE + LINE_THICKNESS * (positionX + 1);
        let calculatedPositionY = PADDING  + positionY * SCALE + LINE_THICKNESS * (positionY + 1);

        context.beginPath();
        context.fillStyle = color;
        context.fillRect(calculatedPositionX, calculatedPositionY, SCALE - LINE_THICKNESS, SCALE - LINE_THICKNESS);
        context.stroke();
    }

    function createVertex(x = null, y = null, isDestination = false, isStartingPoint = false, cost = REGULAR_COST)
    {
        let vertex = {
            visited: false,
            cost: cost,
            isDestination: isDestination,
            isStartingPoint: isStartingPoint,
            x: x,
            y: y
        };
        return JSON.parse(JSON.stringify(vertex));
    }

    function initVertices (unvisitedVertices)
    {
        for (var x = 0; x < DIMENSIONS_NUMBER; x++) {
            for (var y = 0; y < DIMENSIONS_NUMBER; y++) {
                let key = computeKey(x,y);
                unvisitedVertices[key] = createVertex(x, y, false, false);
            }
        }
    }

    function computeKey(x,y) {
        return "x:" + x + "y:" + y;
    }

    drawBoard();

    let unvisitedVertices = [];
    initVertices(unvisitedVertices);

    document.getElementById('debug-button').onclick = function() {
        if (unvisitedVertices) {
            console.log(unvisitedVertices);
        }
    }

    function setObstacle (x,y) {
        let key = computeKey(x,y);
        unvisitedVertices[key] = createVertex(x,y,false,false, INFINITY_COST);
        paintCell(x,y, COLOR_OBSTACLE);
    }

    function setDestination (xIndex,yIndex) {
        for (let key in unvisitedVertices) {
            let vertex = unvisitedVertices[key];
            if (vertex.isDestination && !(vertex.x === xIndex && vertex.y === yIndex)) {
                unvisitedVertices[key] = createVertex(vertex.x, vertex.y, false, false, REGULAR_COST); //reset old destination
                paintCell(vertex.x, vertex.y, COLOR_REGULAR);
            }
        }

        let key = computeKey(xIndex, yIndex);
        unvisitedVertices[key] = createVertex(xIndex, yIndex, true, false, REGULAR_COST);
        DESTINATION_VERTEX_COORDINATES.x = xIndex;
        DESTINATION_VERTEX_COORDINATES.y = yIndex;
        paintCell(xIndex,yIndex, COLOR_DESTINATION);
    }

    function setStartingPoint (xIndex,yIndex) {
        for (let key in unvisitedVertices) {
            let vertex = unvisitedVertices[key];
            if (vertex.isStartingPoint && !(vertex.x === xIndex && vertex.y === yIndex)) {
                unvisitedVertices[key] = createVertex(vertex.x, vertex.y, false, false, REGULAR_COST); //reset old starting point
                paintCell(vertex.x, vertex.y, COLOR_REGULAR);
            }
        }

        let key = computeKey(xIndex, yIndex);
        unvisitedVertices[key] = createVertex(xIndex, yIndex, false, true, REGULAR_COST);
        paintCell(xIndex,yIndex, COLOR_START);
    }

    function setComputingModeIfAllSet()
    {
        let isStartSet = false;
        let isDestSet = false;

        for (let key in unvisitedVertices) {
            let vertex = unvisitedVertices[key];
            if (vertex.isStartingPoint) isStartSet = true;
            if (vertex.isDestination) isDestSet = true;
        }

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

    let heap = {};
    function initMinDistanceHeap(heap)
    {
        for (let key in unvisitedVertices) {
            let vertex = unvisitedVertices[key];
            heap[key] = {
                vertex: vertex,
                shortestDistanceFromStart: INFINITY_COST,
                previousVertex: null,
            };

            if (vertex.isStartingPoint) {
                heap[key].shortestDistanceFromStart = 0
            }
        }
    }

    function findPath() {
        if (!validateGrid()) {
            alert('Some of the checks went wrong, check console for more details - the page will be refreshed');
            window.location.reload();
        }
        initMinDistanceHeap(heap);
        let rootVertexReference = getRootVertexReference();
        let currentVertex = rootVertexReference;
        let timeout = 0;
        while (true) {

            timeout++;
            let unvisitedNeighbours = getCurrentVertexUnvisitedNeighbours(currentVertex.x, currentVertex.y);
            calculateTentativeDistances(currentVertex, unvisitedNeighbours);

            if (currentVertex.isDestination) {
                let shortestPathDistance = getMinDistanceHeapVertex(currentVertex.x, currentVertex.y).shortestDistanceFromStart;

                if (SELECTED_ALGORITHM === AVAILABLE_ALGORITHMS.A_STAR) {
                    shortestPathDistance = calculateShortestPathDistanceAStar(currentVertex);
                }

                setTimeout(drawShortestPath, timeout * 10, currentVertex);
                setTimeout(appendShortestPathResult, (timeout + 1) * 10, shortestPathDistance);
                break;
            }

            currentVertex.visited = true;
            if (!currentVertex.isStartingPoint) {
                setTimeout(paintCell, timeout * 10, currentVertex.x, currentVertex.y, COLOR_PATH);
            }

            removeVertexFromUnvisited(currentVertex);
            currentVertex = selectNextToVisit();
        }
    }

    function appendShortestPathResult(shortestPath)
    {
        var div = document.getElementById('result');
        div.innerHTML += Math.round(shortestPath * 100) / 100;
    }

    function drawShortestPath(destinationVertex)
    {
        let vertex = destinationVertex;
        let timeout = 0;
        while (!vertex.isStartingPoint) {
            timeout++;
            let minDistanceVertex = getMinDistanceHeapVertex(vertex.x, vertex.y);
            let previousVertex = minDistanceVertex.previousVertex;
            if (!previousVertex.isStartingPoint) {
                setTimeout(paintCell, timeout * 10, previousVertex.x, previousVertex.y, COLOR_SHORTEST_PATH);
            }
            vertex = previousVertex;
        }
    }

    function selectNextToVisit() {
        let heapMapWithMinDist = null;

        for (let key in heap) {
            if (!heap[key].vertex.visited && heap[key].vertex.cost < INFINITY_COST) {
                heapMapWithMinDist = heap[key];
            }
        }

        for (let key in heap) {
            let dist = heap[key].shortestDistanceFromStart;
            if (dist < heapMapWithMinDist.shortestDistanceFromStart && !heap[key].vertex.visited && heap[key].vertex.cost < INFINITY_COST) {
                heapMapWithMinDist = heap[key];
            }
        }

        return heapMapWithMinDist.vertex;
    }

    function calculateTentativeDistances(currentVertex, unvisitedNeighbours)
    {
        unvisitedNeighbours.forEach(function (unvisitedNeighbour) {
            let distance = calculateDistanceFromRootVertex(currentVertex, unvisitedNeighbour);

            if (SELECTED_ALGORITHM === AVAILABLE_ALGORITHMS.A_STAR) {
                let distanceToDestinationVertex = calculateDistanceToDestinationVertex(currentVertex);
                distance += distanceToDestinationVertex;
            }

            let minDistanceVertexForUnvisitedNeighbour = getMinDistanceHeapVertex(unvisitedNeighbour.x, unvisitedNeighbour.y);

            if (distance < minDistanceVertexForUnvisitedNeighbour.shortestDistanceFromStart) {
                minDistanceVertexForUnvisitedNeighbour.shortestDistanceFromStart = distance;
                minDistanceVertexForUnvisitedNeighbour.previousVertex = currentVertex;
            }
        });
    }

    function calculateDistanceFromRootVertex(currentVertex, consideredVertex) {
        let distanceFromPreviousVertex = calculateEuclideanDistanceBetweenVertices(consideredVertex, currentVertex);
        let heapMapForCurrentVertex = getMinDistanceHeapVertex(currentVertex.x, currentVertex.y);
        return heapMapForCurrentVertex.shortestDistanceFromStart + distanceFromPreviousVertex;
    }

    function calculateDistanceToDestinationVertex(currentVertex) {
        let destinationVertex = getVertexReference(
            DESTINATION_VERTEX_COORDINATES.x,
            DESTINATION_VERTEX_COORDINATES.y
        );

        return calculateEuclideanDistanceBetweenVertices(currentVertex, destinationVertex);
    }

    function calculateEuclideanDistanceBetweenVertices(vertexA, vertexB) {
        return Math.sqrt(Math.pow((vertexA.x - vertexB.x),2) + Math.pow((vertexA.y - vertexB.y),2));
    }


    function getCurrentVertexUnvisitedNeighbours(x, y) {
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
                let vertex = getVertexReference(cords.x, cords.y);
                if (vertex !== null && vertex !== undefined && !vertex.visited) {
                    unvisitedNeighbours.push(
                        getVertexReference(cords.x, cords.y),
                    );
                }
            }
        });
        return unvisitedNeighbours;
    }

    function isCoordinateValid (cord) {
        return cord >= 0 && cord <= 39;
    }

    function removeVertexFromUnvisited(vertex)
    {
        let key = computeKey(vertex.x, vertex.y);
        delete unvisitedVertices[key];
    }

    function getVertexReference(x, y) {
        let key = computeKey(x,y);
        return unvisitedVertices[key];
    }

    function getRootVertexReference() {
        for (let key in unvisitedVertices) {
            let vertex = unvisitedVertices[key];
            if (vertex.isStartingPoint) {
                return vertex;
            }
        }
    }

    function getMinDistanceHeapVertex(x, y)
    {
        let key = computeKey(x,y);
        return heap[key];
    }

    function validateGrid()
    {
        let isValid = true;
        if (Object.keys(unvisitedVertices).length !== DIMENSIONS_NUMBER * DIMENSIONS_NUMBER) {
            console.log('Grid dimensions check failed')
            isValid = false;
        }

        let startingPointsCount = 0;
        let destinationPointsCount = 0

        for (let key in unvisitedVertices) {
            if (unvisitedVertices[key].isStartingPoint) startingPointsCount++
            if (unvisitedVertices[key].isDestination) destinationPointsCount++
        }

        if (startingPointsCount !== 1) {
            isValid = false;
            console.log('Invalid starting points count');
        }

        if (destinationPointsCount !== 1)
        {
            isValid = false;
            console.log('Invalid destination points count');
        }
        return isValid;
    }

    /**
     * Traverse back to the starting vertex and subtract heuristic value to get real path length
     *
     * @param destinationVertex
     */
    function calculateShortestPathDistanceAStar(destinationVertex)
    {
        let heapMapForCurrent = getMinDistanceHeapVertex(destinationVertex.x, destinationVertex.y);
        let shortestDistance = heapMapForCurrent.shortestDistanceFromStart;

        do {
            let previousVertex = heapMapForCurrent.previousVertex;
            let euclideanDistanceFromVertexToDestination = calculateEuclideanDistanceBetweenVertices(previousVertex, destinationVertex);
            shortestDistance -= euclideanDistanceFromVertexToDestination;
            heapMapForCurrent = getMinDistanceHeapVertex(previousVertex.x, previousVertex.y);
        } while (!heapMapForCurrent.vertex.isStartingPoint)

        return shortestDistance;
    }
};



