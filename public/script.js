
let canvas = document.getElementById("canvas");

// Adjust canvas height to account for the toolbar
canvas.width = 0.98 * window.innerWidth;
canvas.height = window.innerHeight - 70; // 70px to give space for toolbar

var io = io.connect("http://localhost:8080/");

let ctx = canvas.getContext("2d");

// Get all the tool elements from the HTML
let colorPicker = document.getElementById("color-picker");
let penTool = document.getElementById("pen-tool");
let eraserTool = document.getElementById("eraser-tool");
let brushSize = document.getElementById("brush-size");
let clearBtn = document.getElementById("clear-btn");

// Variables to store current tool state
let x;
let y;
let mouseDown = false;
let currentColor = colorPicker.value;
let currentWidth = brushSize.value;
let currentTool = "pen"; // Default tool is pen

// Helper function to apply drawing/erasing styles
function applyContext(data) {
  if (data.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out"; // This makes drawing "erase"
    ctx.lineWidth = data.width;
  } else {
    ctx.globalCompositeOperation = "source-over"; // This is normal drawing
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
  }
}

// Event listeners for tool changes
colorPicker.onchange = (e) => {
  currentColor = e.target.value;
};

brushSize.onchange = (e) => {
  currentWidth = e.target.value;
};

penTool.onclick = () => {
  currentTool = "pen";
};

eraserTool.onclick = () => {
  currentTool = "eraser";
};

clearBtn.onclick = () => {
  // Emit a "clear" event to the server
  io.emit("clear");
};

// --- Updated Event Handlers ---

window.onmousedown = (e) => {
  // Apply local context first
  applyContext({ tool: currentTool, color: currentColor, width: currentWidth });
  
  ctx.moveTo(x, y);
  
  // Send all data (pos, color, width, tool)
  io.emit("down", { x: x, y: y, color: currentColor, width: currentWidth, tool: currentTool });
  mouseDown = true;
};

window.onmouseup = (e) => {
  mouseDown = false;
  // NEW: Also call beginPath() on mouseup to prevent lines from connecting
  // when you click one spot, lift, and click another.
  ctx.beginPath();
};

// Listen for the "onclear" event from server
io.on("onclear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // ***** THE FIX IS HERE *****
  // Tell the context to forget the old path and start a new one.
  ctx.beginPath();
});

// Updated "ondraw" to use the applyContext helper
io.on("ondraw", (data) => {
  applyContext(data); // Use the color/width/tool from the other user
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
});

// Updated "ondown" to use the applyContext helper
io.on("ondown", (data) => {
  applyContext(data); // Use the color/width/tool from the other user
  ctx.moveTo(data.x, data.y);
});

window.onmousemove = (e) => {
  // Set x and y relative to the canvas, accounting for the toolbar
  x = e.clientX;
  y = e.clientY - 60; // Subtract toolbar height (60px)

  if (mouseDown) {
    // Apply local context before drawing
    applyContext({ tool: currentTool, color: currentColor, width: currentWidth });
    
    // Send all data
    io.emit("draw", { x: x, y: y, color: currentColor, width: currentWidth, tool: currentTool });
    
    // Draw locally
    ctx.lineTo(x, y);
    ctx.stroke();
  }

};
