const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const buildingsList = document.getElementById('buildingsList');
const currentMousePosition = document.getElementById('currentMousePosition');

const gridSize = 1300;
const squareSize = 20;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX, startY;
let mouseX, mouseY;

const cities = [];

// Load default cities from buildings.json
fetch('buildings.json')
    .then(response => response.json())
    .then(data => {
        console.log('Loaded buildings:', data);
        data.forEach(city => {
            addCity(city.x, city.y, city.name);
        });
        drawGrid();
        updateBuildingsList();
    })
    .catch(error => console.error('Error loading buildings:', error));

function resizeCanvas() {
    console.log("Resizing canvas...");
    canvas.width = window.innerWidth - 300; // Adjust for sidebar
    canvas.height = window.innerHeight;
    console.log("Canvas size set to:", canvas.width, canvas.height);
    drawGrid();
}

function drawGrid() {
    console.log("Drawing grid...");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const adjustedSquareSize = squareSize * zoomLevel;

    // Calculate the visible grid range based on pan and zoom
    const startX = Math.floor(panX / adjustedSquareSize);
    const startY = Math.floor(panY / adjustedSquareSize);
    const endX = Math.ceil((panX + canvas.width) / adjustedSquareSize);
    const endY = Math.ceil((panY + canvas.height) / adjustedSquareSize);

    console.log(`Drawing visible grid from (${startX}, ${startY}) to (${endX}, ${endY})`);

    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            const screenX = (x * adjustedSquareSize) - panX;
            const screenY = (y * adjustedSquareSize) - panY;

            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(screenX, screenY, adjustedSquareSize, adjustedSquareSize);
        }
    }

    // Draw cities
    cities.forEach(city => {
        console.log("Drawing city at:", city.x, city.y);
        ctx.fillStyle = 'blue';
        const cityX = (city.x * squareSize - panX) * zoomLevel;
        const cityY = (city.y * squareSize - panY) * zoomLevel;
        ctx.fillRect(cityX, cityY, 2 * adjustedSquareSize, 2 * adjustedSquareSize);
    });
}

function addCity(x, y, name = "Unnamed City") {
    if (x < 0 || y < 0 || x + 2 > gridSize || y + 2 > gridSize) {
        alert("City placement is out of bounds!");
        return;
    }
    const city = { x, y, name };
    cities.push(city);
    drawGrid();
    updateBuildingsList();
}

function updateBuildingsList() {
    buildingsList.innerHTML = '';
    cities.forEach((city, index) => {
        const buildingDiv = document.createElement('div');
        buildingDiv.classList.add('building-entry');
        buildingDiv.innerHTML = `
            <span>(${city.x}, ${city.y})</span>
            <input type="text" value="${city.name}" onchange="renameCity(${index}, this.value)">
        `;
        buildingsList.appendChild(buildingDiv);
    });
}

function renameCity(index, newName) {
    cities[index].name = newName;
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
    startX = e.clientX - panX;
    startY = e.clientY - panY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        drawGrid();
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

// Add city with 'c' key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'c') {
        // Calculate which square the mouse is currently over
        const gridMouseX = Math.floor((mouseX + panX) / (squareSize * zoomLevel));
        const gridMouseY = Math.floor((mouseY + panY) / (squareSize * zoomLevel));
        addCity(gridMouseX, gridMouseY);
    }
});

// Resize and initialize canvas
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
