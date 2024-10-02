const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 1300;
const squareSize = 20;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX, startY;

const cities = [];

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	drawGrid();
}

function drawGrid() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const adjustedSquareSize = squareSize * zoomLevel;

	for (let x = -panX % adjustedSquareSize; x < canvas.width; x += adjustedSquareSize) {
		for (let y = -panY % adjustedSquareSize; y < canvas.height; y += adjustedSquareSize) {
			ctx.strokeStyle = '#ddd';
			ctx.strokeRect(x, y, adjustedSquareSize, adjustedSquareSize);
		}
	}

	// Draw cities
	cities.forEach(city => {
		ctx.fillStyle = 'blue';
		const cityX = (city.x * squareSize - panX) * zoomLevel;
		const cityY = (city.y * squareSize - panY) * zoomLevel;
		ctx.fillRect(cityX, cityY, 2 * adjustedSquareSize, 2 * adjustedSquareSize);
	});
}

function addCity(x, y) {
	cities.push({ x, y });
	drawGrid();
}

// Zoom functionality
function zoom(delta) {
	const factor = 1.1;
	const oldZoom = zoomLevel;
	zoomLevel *= delta > 0 ? factor : 1 / factor;
	const mouseX = (event.clientX - panX) / oldZoom;
	const mouseY = (event.clientY - panY) / oldZoom;
	panX = event.clientX - mouseX * zoomLevel;
	panY = event.clientY - mouseY * zoomLevel;
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
});

canvas.addEventListener('mouseup', () => {
	isPanning = false;
});

canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	zoom(e.deltaY);
});

// Zoom buttons
document.getElementById('zoomInBtn').addEventListener('click', () => zoom(-1));
document.getElementById('zoomOutBtn').addEventListener('click', () => zoom(1));

// Add city with 'c' key press
document.addEventListener('keydown', (e) => {
	if (e.key === 'c') {
		// Calculate which square is in the center
		const centerX = Math.floor((canvas.width / 2 + panX) / (squareSize * zoomLevel));
		const centerY = Math.floor((canvas.height / 2 + panY) / (squareSize * zoomLevel));
		addCity(centerX, centerY);
	}
});

// Resize and initialize canvas
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

