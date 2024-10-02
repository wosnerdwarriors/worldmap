const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const buildingsList = document.getElementById('buildingsList');
const currentMousePosition = document.getElementById('currentMousePosition');
const modeSelect = document.getElementById('modeSelect');
const buildingSelect = document.getElementById('buildingSelect');

const gridSize = 1300;
const squareSize = 20;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX, startY;
let mouseX, mouseY;
let mode = 'pan'; // Default to 'pan' mode
let selectedBuilding = 'city'; // Default building

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

// Load default cities from buildings.json
fetch('buildings.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(city => {
            addCity(city.x, city.y, city.name, city.type);
        });
        drawGrid(); // Ensure grid is drawn after cities are added
        updateBuildingsList();
    })
    .catch(error => console.error('Error loading buildings:', error));

function resizeCanvas() {
    canvas.width = window.innerWidth - 300; // Adjust for sidebar
    canvas.height = window.innerHeight;
    drawGrid();
}

function drawGrid() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const adjustedSquareSize = squareSize * zoomLevel;

    // Fill the canvas with green
    ctx.fillStyle = 'lightgreen';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the visible grid within map boundaries
    for (let x = Math.max(Math.floor(panX / adjustedSquareSize), 0); x < Math.min(Math.ceil((panX + canvas.width) / adjustedSquareSize), gridSize); x++) {
        for (let y = Math.max(Math.floor(panY / adjustedSquareSize), 0); y < Math.min(Math.ceil((panY + canvas.height) / adjustedSquareSize), gridSize); y++) {
            const screenX = (x * adjustedSquareSize) - panX;
            const screenY = (y * adjustedSquareSize) - panY;
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(screenX, screenY, adjustedSquareSize, adjustedSquareSize);
        }
    }

    // Draw cities and buildings
    cities.forEach(city => {
        const building = buildingData[city.type];
        ctx.fillStyle = building.color;
        const cityX = (city.x * squareSize - panX) * zoomLevel;
        const cityY = (city.y * squareSize - panY) * zoomLevel;
        const buildingSize = building.size * adjustedSquareSize;
        ctx.fillRect(cityX, cityY, buildingSize, buildingSize);

        // Draw building label (the letter)
        ctx.fillStyle = 'white';
        ctx.font = `${buildingSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(building.letter, cityX + buildingSize / 2, cityY + buildingSize / 2);
    });
}

function addCity(x, y, name, type) {
    const building = buildingData[type];
    const buildingSize = building.size;

    // Ensure the building doesn't overlap or go outside the map
    if (x < 0 || y < 0 || x + buildingSize > gridSize || y + buildingSize > gridSize || cities.some(city => (city.x < x + buildingSize && city.x + buildingData[city.type].size > x && city.y < y + buildingSize && city.y + buildingData[city.type].size > y))) {
        alert("Building placement is invalid (overlap or out of bounds)!");
        return;
    }

    cities.push({ x, y, name, type });
    drawGrid();
    updateBuildingsList();
}

function updateBuildingsList() {
    buildingsList.innerHTML = '';
    cities.forEach((city, index) => {
        const building = buildingData[city.type];
        const buildingDiv = document.createElement('div');
        buildingDiv.classList.add('building-entry');

        // Display name and type for certain buildings, and only type for others
        let buildingDisplay = building.showName ? `${city.name} (Type: ${city.type})` : `${city.type}`;
        
        buildingDiv.innerHTML = `
            <span>${buildingDisplay} (${city.x}, ${city.y})</span>
            <button onclick="removeCity(${index})">Remove</button>
        `;
        buildingsList.appendChild(buildingDiv);
    });
}

function removeCity(index) {
    cities.splice(index, 1);
    drawGrid();
    updateBuildingsList();
}

function panMap(deltaX, deltaY) {
    panX += deltaX;
    panY += deltaY;
    drawGrid();
}

function zoom(delta) {
    const factor = 1.1;
    const oldZoom = zoomLevel;
    zoomLevel *= delta > 0 ? 1 / factor : factor;

    // Prevent zooming out too far
    const minZoom = Math.min(canvas.width / (gridSize * squareSize), canvas.height / (gridSize * squareSize));
    zoomLevel = Math.max(zoomLevel, minZoom);

    const mouseGridX = (mouseX + panX) / oldZoom;
    const mouseGridY = (mouseY + panY) / oldZoom;

    panX = mouseX - mouseGridX * zoomLevel;
    panY = mouseY - mouseGridY * zoomLevel;

    drawGrid();
}

// Event Listeners
canvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        // Adjust pan direction to simulate dragging the map
        panMap(-(e.clientX - startX), -(e.clientY - startY));
        startX = e.clientX;
        startY = e.clientY;
    }

    // Update mouse position
    mouseX = e.clientX;
    mouseY = e.clientY;
    const gridMouseX = Math.floor((mouseX + panX) / (squareSize * zoomLevel));
    const gridMouseY = Math.floor((mouseY + panY) / (squareSize * zoomLevel));
    currentMousePosition.textContent = `Mouse: (${gridMouseX}, ${gridMouseY})`;
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom(e.deltaY);
});

// Switch between pan and place modes
modeSelect.addEventListener('change', (e) => {
    mode = e.target.value;
});

// Building selection
buildingSelect.addEventListener('change', (e) => {
    selectedBuilding = e.target.value;
});

// Add building on mouse click in "place" mode
canvas.addEventListener('click', (e) => {
    if (mode === 'place') {
        const gridMouseX = Math.floor((mouseX + panX) / (squareSize * zoomLevel));
        const gridMouseY = Math.floor((mouseY + panY) / (squareSize * zoomLevel));
        addCity(gridMouseX, gridMouseY, selectedBuilding, selectedBuilding);
    }
});

// Jump to Coordinates
jumpButton.addEventListener('click', () => {
    const jumpX = parseInt(jumpXInput.value);
    const jumpY = parseInt(jumpYInput.value);

    if (isNaN(jumpX) || isNaN(jumpY) || jumpX < 0 || jumpX > 1298 || jumpY < 0 || jumpY > 1298) {
        alert('Please enter valid coordinates between 0 and 1298');
        return;
    }

    // Center the view on the specified coordinates
    panX = (jumpX * squareSize * zoomLevel) - (canvas.width / 2);
    panY = (jumpY * squareSize * zoomLevel) - (canvas.height / 2);

    drawGrid();
});

// Resize and initialize canvas
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
