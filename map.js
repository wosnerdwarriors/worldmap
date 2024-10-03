const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const buildingsList = document.getElementById('buildingsList');
const currentMousePosition = document.getElementById('currentMousePosition');
const panButton = document.getElementById('panButton');
const buildButton = document.getElementById('buildButton');
const buildingSelect = document.getElementById('buildingSelect');
const xInput = document.getElementById('xInput');
const yInput = document.getElementById('yInput');
const placeByXYButton = document.getElementById('placeByXYButton');
const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');
const buildingDetails = document.getElementById('buildingDetails');

const gridSize = 400; // Debugging purpose size
const squareSize = 20;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX, startY, startPanX, startPanY;
let mouseX = 0, mouseY = 0;
let mode = 'pan'; // Default to 'pan' mode
let selectedBuilding = 'city'; // Default building
let lastClickedX = 0;
let lastClickedY = 0;
let debugMode = false;

// Enable debugging if URL contains ?debug=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
    debugMode = true;
    console.log("Debug mode activated");
}

const cities = [];

// Building colors, sizes, letters, and display rules
const buildingData = {
    'bear trap': { size: 3, color: 'brown', letter: 'B', showName: false },
    'city': { size: 2, color: 'gray', letter: 'C', showName: true },
    'meat farm': { size: 2, color: 'red', letter: 'M', showName: false },
    'wood farm': { size: 2, color: 'green', letter: 'W', showName: false },
    'coal farm': { size: 2, color: 'black', letter: 'C', showName: false },
    'iron farm': { size: 2, color: 'orange', letter: 'I', showName: false },
    'facility': { size: 3, color: 'purple', letter: 'F', showName: true },
    'turret': { size: 2, color: 'yellow', letter: 'T', showName: true },
    'castle': { size: 6, color: 'blue', letter: '$', showName: false }
};

// Log a message if in debug mode
function debugLog(message) {
    if (debugMode) {
        console.log(message);
    }
}

// Load default cities from buildings.json
fetch('buildings.json')
    .then(response => response.json())
    .then(data => {
        debugLog(`Loaded buildings data: ${JSON.stringify(data)}`);
        data.forEach(city => {
            cities.push({ x: city.x, y: city.y, name: city.name, type: city.type });
        });
        drawGrid();
        updateBuildingsList();
    })
    .catch(error => {
        console.error('Error loading buildings:', error);
        debugLog(`Error loading buildings: ${error}`);
    });

function resizeCanvas() {
    canvas.width = window.innerWidth - 300; // Adjust for sidebar
    canvas.height = window.innerHeight;
    drawGrid();
}

// Draw the grid and buildings
function drawGrid() {
    debugLog("Start Drawing Grid");

    // Clear the canvas and fill the background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const adjustedSquareSize = squareSize * zoomLevel;

    // Fill the background with blue for area outside the map
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the map area in light green
    ctx.fillStyle = 'lightgreen';
    const mapWidth = gridSize * adjustedSquareSize;
    const mapHeight = gridSize * adjustedSquareSize;
    ctx.fillRect(-panX, -panY, mapWidth, mapHeight);

    // Draw grid lines and buildings
    drawGridLines(adjustedSquareSize);
    cities.forEach(city => drawBuilding(city));

    // Update zoom level display, only if the element exists
    if (zoomLevelDisplay) {
        zoomLevelDisplay.textContent = `Zoom Level: ${zoomLevel.toFixed(2)}`;
    }

    debugLog("Finish Drawing Grid");
}

// Draw grid lines
function drawGridLines(adjustedSquareSize) {
    ctx.strokeStyle = '#ddd';
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const screenX = (x * adjustedSquareSize) - panX;
            const screenY = (y * adjustedSquareSize) - panY;
            ctx.strokeRect(screenX, screenY, adjustedSquareSize, adjustedSquareSize);
        }
    }
}

// Draw buildings on the grid
function drawBuilding(city) {
    const building = buildingData[city.type];
    const adjustedSquareSize = squareSize * zoomLevel;
    const cityX = city.x * adjustedSquareSize - panX;
    const cityY = city.y * adjustedSquareSize - panY;
    const buildingSize = building.size * adjustedSquareSize;

    ctx.fillStyle = building.color;
    ctx.fillRect(cityX, cityY, buildingSize, buildingSize);

    // Draw building letter in high resolution
    ctx.fillStyle = 'white';
    ctx.font = `${30 * zoomLevel}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(building.letter, cityX + buildingSize / 2, cityY + buildingSize / 2);

    debugLog(`Drew building: ${city.name || city.type} at (${city.x}, ${city.y})`);
}

// Handle panning
canvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    startPanX = panX;
    startPanY = panY;
    debugLog("Mouse down: starting panning");
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        // Adjust pan based on mouse movement
        panX = startPanX + (startX - e.clientX);
        panY = startPanY + (startY - e.clientY);
        drawGrid();
        debugLog(`Panning to: (${panX}, ${panY})`);
    }

    // Update mouse position for display
    mouseX = e.clientX;
    mouseY = e.clientY;
    const gridMouseX = Math.floor((mouseX + panX) / (squareSize * zoomLevel));
    const gridMouseY = Math.floor((mouseY + panY) / (squareSize * zoomLevel));
    if (currentMousePosition) {
        currentMousePosition.textContent = `Mouse: (${gridMouseX}, ${gridMouseY})`;
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    debugLog("Mouse up: stopped panning");
});

// Zooming and wheel events
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom(e.deltaY);
    debugLog(`Zooming: delta ${e.deltaY}`);
}, { passive: false });

function zoom(delta) {
    const factor = 1.1;
    const oldZoom = zoomLevel;
    zoomLevel *= delta > 0 ? 1 / factor : factor;
    drawGrid();
}

// Update the buildings list
function updateBuildingsList() {
    if (!buildingsList) {
        debugLog("Buildings list element not found");
        return;
    }
    buildingsList.innerHTML = '';
    cities.forEach((city, index) => {
        const building = buildingData[city.type];
        const buildingDiv = document.createElement('button');
        buildingDiv.classList.add('building-entry');
        let buildingDisplay = building.showName ? `${city.name} (Type: ${city.type})` : `${city.type}`;
        buildingDiv.innerHTML = `${buildingDisplay} (${city.x}, ${city.y})`;
        buildingDiv.addEventListener('click', () => {
            jumpToCity(city.x, city.y);
        });
        buildingsList.appendChild(buildingDiv);
        debugLog(`Added building to list: ${buildingDisplay}`);
    });
}

// Handle pan/build mode toggling
panButton.addEventListener('click', () => {
    mode = 'pan';
    panButton.classList.add('active');
    buildButton.classList.remove('active');
    debugLog('Switched to pan mode');
});

buildButton.addEventListener('click', () => {
    mode = 'build';
    buildButton.classList.add('active');
    panButton.classList.remove('active');
    debugLog('Switched to build mode');
});

// Handle building selection
buildingSelect.addEventListener('change', (e) => {
    selectedBuilding = e.target.value;
    debugLog(`Selected building: ${selectedBuilding}`);
});

// Handle placing a building on the map
canvas.addEventListener('click', (e) => {
    if (mode === 'build') {
        const gridMouseX = Math.floor((mouseX + panX) / (squareSize * zoomLevel));
        const gridMouseY = Math.floor((mouseY + panY) / (squareSize * zoomLevel));
        addBuilding(gridMouseX, gridMouseY, null, selectedBuilding); // Use selectedBuilding here
        debugLog(`Placed building: ${selectedBuilding} at (${gridMouseX}, ${gridMouseY})`);
    }
});

// Manual building placement using X, Y inputs
placeByXYButton.addEventListener('click', () => {
    const x = parseInt(xInput.value);
    const y = parseInt(yInput.value);
    addBuilding(x, y, null, selectedBuilding); // Use selectedBuilding here
    debugLog(`Manually placed building: ${selectedBuilding} at (${x}, ${y})`);
});

// Add building to the grid
function addBuilding(x, y, name, type) {
    const building = buildingData[type]; // Get building details from the selected type
    const buildingSize = building.size;

    // Check if building placement is valid
    if (x < 0 || y < 0 || x + buildingSize > gridSize || y + buildingSize > gridSize) {
        alert("Building placement is invalid!");
        return;
    }

    cities.push({ x, y, name, type });
    drawGrid();
    updateBuildingsList();
    debugLog(`Added ${type} at (${x}, ${y})`);
}

// Update the buildings list
function updateBuildingsList() {
    if (!buildingsList) {
        debugLog("Buildings list element not found");
        return;
    }
    buildingsList.innerHTML = '';
    cities.forEach((city, index) => {
        const building = buildingData[city.type];
        const buildingDiv = document.createElement('button');
        buildingDiv.classList.add('building-entry');
        let buildingDisplay = building.showName ? `${city.name} (Type: ${city.type})` : `${city.type}`;
        buildingDiv.innerHTML = `${buildingDisplay} (${city.x}, ${city.y})`;
        buildingDiv.addEventListener('click', () => {
            jumpToBuilding(city.x, city.y);
        });
        buildingsList.appendChild(buildingDiv);
        debugLog(`Added building to list: ${buildingDisplay}`);
    });
}

// Jump to building
function jumpToBuilding(x, y) {
    panX = (x * squareSize * zoomLevel) - (canvas.width / 2);
    panY = (y * squareSize * zoomLevel) - (canvas.height / 2);
    drawGrid();
    debugLog(`Jumped to building at: (${x}, ${y})`);
}

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

