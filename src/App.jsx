import React, { useEffect, useRef, useState, useCallback } from "react";

// Dummy HTML template (simulating backend response)
const adHtmlTemplate = `
  <div id="ad-template" style="
    width: 800px;
    height: 500px;
    background-image: url('https://images.unsplash.com/photo-1752440284390-26d0527bbb9f?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
    background-size: cover;
    background-position: center;
    position: relative;
  ">
    <h1 style="position: absolute; left: 50px; top: 60px; font-size: 42px; color: #ffffff; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Unleash Your Potential</h1>
    <p style="position: absolute; left: 50px; top: 140px; font-size: 20px; color: #f1faff; font-weight: 400;">Master in-demand skills with 50% off all premium courses.</p>
    <button style="position: absolute; left: 50px; top: 230px; font-size: 18px; background: #7873f5; color: white; font-weight: bold; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">Start Learning</button>
  </div>
`;

const App = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const colorChangeTimeoutRef = useRef(null); // For debouncing color changes
  const fontSizeTimeoutRef = useRef(null); // For debouncing font size changes
  const borderRadiusTimeoutRef = useRef(null); // For debouncing border radius changes
  const [ctx, setCtx] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState([]);
  const [library, setLibrary] = useState([]);
  const [marketingVisualAssets, setMarketingVisualAssets] = useState([]);
  const [persuasiveAdCopywriting, setPersuasiveAdCopywriting] = useState([]);
  const [activeSection, setActiveSection] = useState("All");

  // History management for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalTemplate, setOriginalTemplate] = useState(null);

  // Editor state
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [borderRadius, setBorderRadius] = useState(0);

  // Track if user is actively changing values (to prevent history saves)
  const [isChangingFontSize, setIsChangingFontSize] = useState(false);
  const [isChangingBorderRadius, setIsChangingBorderRadius] = useState(false);
  const [isChangingColor, setIsChangingColor] = useState(false);

  // Mock library data for demonstration
  const mockLibraryData = [
    { id: 1, image: "/api/placeholder/200/140", generated_image: null },
    { id: 2, image: "/api/placeholder/200/140", generated_image: null },
    { id: 3, image: "/api/placeholder/200/140", generated_image: null },
  ];

  useEffect(() => {
    // Mock API call - replace with actual API call
    setLibrary(mockLibraryData);
    setMarketingVisualAssets(mockLibraryData);
    setPersuasiveAdCopywriting([
      {
        heading: "Summer Sale",
        body: "Get 50% off on all items",
        cta: "Shop Now",
      },
      {
        heading: "New Arrivals",
        body: "Check out our latest collection",
        cta: "Explore",
      },
    ]);
  }, []);

  const buttonLabels = [
    "All",
    "Library",
    "Marketing Visual Assets",
    "Persuasive Ad Copywriting",
    "High Impact Product Photography",
    "Videos",
    "Prompts",
  ];

  const renderContent = () => {
    let items = [];

    switch (activeSection) {
      case "Marketing Visual Assets":
        items = marketingVisualAssets;
        break;
      case "Persuasive Ad Copywriting":
        items = persuasiveAdCopywriting;
        break;
      case "Library":
        items = library;
        break;
      case "All":
        items = [...library, ...marketingVisualAssets];
        break;
      default:
        return <p className="px-4 text-sm text-gray-500">Select a section.</p>;
    }

    if (activeSection === "Persuasive Ad Copywriting") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-500 rounded-xl p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-600">
                {item.heading}
              </h3>
              <p className="text-gray-600 mt-2">{item.body}</p>
              <p className="mt-4 inline-block text-white rounded hover:bg-blue-700 transition">
                {item.cta}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          width: "100%",
        }}
      >
        {items.map((img, idx) => {
          const src = `https://images.unsplash.com/photo-${
            1500000000000 + idx
          }?w=200&h=140&fit=crop&crop=center`;
          return (
            <div
              key={img.id || idx}
              onClick={() => handleImageSelect(img)}
              style={{
                cursor: "pointer",
                borderRadius: 8,
                overflow: "hidden",
                border: "2px solid transparent",
                transition: "0.3s",
              }}
            >
              <img
                src={src}
                alt={`img-${idx}`}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // History management functions
  const saveToHistory = useCallback(
    (newElements, newBackgroundImage = null) => {
      console.log("🔄 saveToHistory called");

      const state = {
        elements: JSON.parse(JSON.stringify(newElements)),
        backgroundImage: newBackgroundImage
          ? {
              src: newBackgroundImage.src,
              width: newBackgroundImage.width,
              height: newBackgroundImage.height,
            }
          : null,
        timestamp: Date.now(),
      };

      setHistory((prevHistory) => {
        // Remove any history after current index (when making new changes after undo)
        const newHistory = prevHistory.slice(0, historyIndex + 1);

        // Check if this state is different from the current state
        const currentState = newHistory[newHistory.length - 1];
        if (
          !currentState ||
          JSON.stringify(currentState.elements) !==
            JSON.stringify(state.elements) ||
          currentState.backgroundImage?.src !== state.backgroundImage?.src
        ) {
          const updatedHistory = [...newHistory, state];
          // Limit history to 50 states
          return updatedHistory.slice(-50);
        }
        return newHistory;
      });

      setHistoryIndex((prevIndex) => {
        const newIndex = Math.min(prevIndex + 1, 49);
        return newIndex;
      });
    },
    [historyIndex]
  );

  // Update selected element reference
  const updateSelectedElementReference = useCallback(
    (newElements, currentSelectedId) => {
      console.log("🔍 updateSelectedElementReference called");
      if (!currentSelectedId) {
        setSelectedElement(null);
        resetEditorControls();
        return null;
      }

      const matchingElement = newElements.find(
        (el) => el.id === currentSelectedId
      );
      if (matchingElement) {
        setSelectedElement(matchingElement);
        updateEditorControls(matchingElement);
        return matchingElement;
      } else {
        setSelectedElement(null);
        resetEditorControls();
        return null;
      }
    },
    []
  );

  // Update editor controls
  const updateEditorControls = useCallback((element) => {
    console.log("⚙️ updateEditorControls called");
    setFontSize(element.fontSize);
    setFontFamily(element.fontFamily);
    setFontWeight(element.fontWeight);
    setFontStyle(element.fontStyle);
    setTextColor(element.color);
    setBackgroundColor(element.backgroundColor);
    setBorderRadius(element.borderRadius);
  }, []);

  // Reset editor controls
  const resetEditorControls = useCallback(() => {
    console.log("🔄 resetEditorControls called");
    setFontSize(20);
    setFontFamily("Arial");
    setFontWeight("normal");
    setFontStyle("normal");
    setTextColor("#000000");
    setBackgroundColor("#ffffff");
    setBorderRadius(0);
  }, []);

  // Undo function
  const undo = useCallback(() => {
    console.log("↶ undo called, current historyIndex:", historyIndex);

    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      const currentSelectedId = selectedElement?.id;

      console.log("Going to index:", newIndex, "State:", prevState);

      setHistoryIndex(newIndex);

      // Restore elements
      setElements(prevState.elements);

      // Restore background image
      if (prevState.backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setBackgroundImage(img);
          updateSelectedElementReference(prevState.elements, currentSelectedId);
        };
        img.onerror = () => {
          setBackgroundImage(null);
          updateSelectedElementReference(prevState.elements, currentSelectedId);
        };
        img.src = prevState.backgroundImage.src;
      } else {
        setBackgroundImage(null);
        updateSelectedElementReference(prevState.elements, currentSelectedId);
      }
    }
  }, [history, historyIndex, selectedElement, updateSelectedElementReference]);

  // Redo function
  const redo = useCallback(() => {
    console.log(
      "↷ redo called, current historyIndex:",
      historyIndex,
      "history length:",
      history.length
    );

    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      const currentSelectedId = selectedElement?.id;

      console.log("Going to index:", newIndex, "State:", nextState);

      setHistoryIndex(newIndex);

      // Restore elements
      setElements(nextState.elements);

      // Restore background image
      if (nextState.backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setBackgroundImage(img);
          updateSelectedElementReference(nextState.elements, currentSelectedId);
        };
        img.onerror = () => {
          setBackgroundImage(null);
          updateSelectedElementReference(nextState.elements, currentSelectedId);
        };
        img.src = nextState.backgroundImage.src;
      } else {
        setBackgroundImage(null);
        updateSelectedElementReference(nextState.elements, currentSelectedId);
      }
    }
  }, [history, historyIndex, selectedElement, updateSelectedElementReference]);

  // Reset to original template
  const resetTemplate = useCallback(() => {
    console.log("🔄 resetTemplate called");
    if (!originalTemplate) return;

    setElements(originalTemplate.elements);

    if (originalTemplate.backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setBackgroundImage(img);
      img.onerror = () => setBackgroundImage(null);
      img.src = originalTemplate.backgroundImage.src;
    } else {
      setBackgroundImage(null);
    }

    setSelectedElement(null);
    resetEditorControls();

    // Reset history
    setHistory([]);
    setHistoryIndex(-1);

    // Save the reset state as the first history entry
    setTimeout(() => {
      saveToHistory(
        originalTemplate.elements,
        originalTemplate.backgroundImage
          ? {
              src: originalTemplate.backgroundImage.src,
              width: originalTemplate.backgroundImage.width,
              height: originalTemplate.backgroundImage.height,
            }
          : null
      );
    }, 100);
  }, [originalTemplate, saveToHistory, resetEditorControls]);

  // Parse HTML template
  const parseTemplate = useCallback((htmlString) => {
    console.log("📝 parseTemplate called");
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const container = doc.getElementById("ad-template");

    if (!container) return;

    const bgStyle = container.style.backgroundImage;
    const bgUrl = bgStyle?.startsWith("url")
      ? bgStyle.replace(/^url\(["']?/, "").replace(/["']?\)$/, "")
      : null;

    const textElements = container.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div, button"
    );
    const parsedElements = [];

    textElements.forEach((el, index) => {
      const text = el.textContent.trim();
      if (!text) return;

      const style = el.style;
      const tagName = el.tagName.toLowerCase();

      parsedElements.push({
        id: `element-${index}`,
        type: tagName === "button" ? "button" : "text",
        text,
        x: parseInt(style.left) || 50,
        y: parseInt(style.top) || 50 + index * 50,
        fontSize:
          parseInt(style.fontSize) ||
          (tagName === "h1" ? 42 : tagName === "h3" ? 16 : 20),
        fontFamily: "Arial",
        fontWeight:
          style.fontWeight ||
          (["h1", "h3", "button"].includes(tagName) ? "bold" : "normal"),
        fontStyle: style.fontStyle || "normal",
        color: style.color || (tagName === "button" ? "#ffffff" : "#000000"),
        backgroundColor:
          tagName === "button"
            ? style.background || style.backgroundColor || "#7873f5"
            : style.backgroundColor || "transparent",
        borderRadius:
          parseInt(style.borderRadius) || (tagName === "button" ? 8 : 0),
        padding: tagName === "button" ? 12 : 0,
        width: tagName === "button" ? 200 : 300,
        height: tagName === "button" ? 50 : null,
        maxWidth: 400,
      });
    });

    if (bgUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        console.log("🖼️ Background image loaded");
        setBackgroundImage(img);
        setElements(parsedElements);

        const bgState = {
          src: img.src,
          width: img.width,
          height: img.height,
        };

        const originalState = {
          elements: JSON.parse(JSON.stringify(parsedElements)),
          backgroundImage: bgState,
        };

        setOriginalTemplate(originalState);

        // Initialize history with the loaded template
        const initialState = {
          elements: JSON.parse(JSON.stringify(parsedElements)),
          backgroundImage: bgState,
          timestamp: Date.now(),
        };

        setHistory([initialState]);
        setHistoryIndex(0);
      };

      img.onerror = () => {
        console.log("❌ Background image failed to load");
        setBackgroundImage(null);
        setElements(parsedElements);

        const originalState = {
          elements: JSON.parse(JSON.stringify(parsedElements)),
          backgroundImage: null,
        };

        setOriginalTemplate(originalState);

        // Initialize history with the loaded template
        const initialState = {
          elements: JSON.parse(JSON.stringify(parsedElements)),
          backgroundImage: null,
          timestamp: Date.now(),
        };

        setHistory([initialState]);
        setHistoryIndex(0);
      };

      img.src = bgUrl;
    } else {
      setBackgroundImage(null);
      setElements(parsedElements);

      const originalState = {
        elements: JSON.parse(JSON.stringify(parsedElements)),
        backgroundImage: null,
      };

      setOriginalTemplate(originalState);

      // Initialize history with the loaded template
      const initialState = {
        elements: JSON.parse(JSON.stringify(parsedElements)),
        backgroundImage: null,
        timestamp: Date.now(),
      };

      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  // Get resize handles
  const getResizeHandles = useCallback((element) => {
    if (!element) return [];

    const handleSize = 8;
    const handles = [];

    if (element.type === "button") {
      // Bottom-right corner handle for buttons
      handles.push({
        type: "se",
        x: element.x + element.width - handleSize / 2,
        y: element.y + element.height - handleSize / 2,
        width: handleSize,
        height: handleSize,
      });
    } else {
      // Right edge handle for text elements
      const width = element.width || 300;
      handles.push({
        type: "e",
        x: element.x + width - handleSize / 2,
        y: element.y + 10,
        width: handleSize,
        height: handleSize,
      });
    }

    return handles;
  }, []);

  // Draw single element
  const drawElement = useCallback(
    (ctx, element, isSelected = false) => {
      console.log(`🎨 drawElement called for ${element.id}`);
      ctx.save();

      ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
      ctx.textBaseline = "top";

      if (element.type === "button") {
        const buttonWidth = element.width;
        const buttonHeight = element.height;

        ctx.fillStyle = element.backgroundColor;

        if (element.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(
            element.x,
            element.y,
            buttonWidth,
            buttonHeight,
            element.borderRadius
          );
          ctx.fill();
        } else {
          ctx.fillRect(element.x, element.y, buttonWidth, buttonHeight);
        }

        ctx.fillStyle = element.color;
        const textMetrics = ctx.measureText(element.text);
        const textX = element.x + (buttonWidth - textMetrics.width) / 2;
        const textY = element.y + (buttonHeight - element.fontSize) / 2;

        ctx.fillText(element.text, textX, textY);

        if (isSelected) {
          ctx.strokeStyle = "#ff4757";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            element.x - 2,
            element.y - 2,
            buttonWidth + 4,
            buttonHeight + 4
          );
          ctx.setLineDash([]);

          const handles = getResizeHandles(element);
          ctx.fillStyle = "#ff4757";
          handles.forEach((handle) => {
            ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
          });
        }
      } else {
        ctx.fillStyle = element.color;

        const words = element.text.split(" ");
        const lines = [];
        let currentLine = "";
        const maxWidth = element.width || 300;

        for (let word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && currentLine !== "") {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);

        lines.forEach((line, index) => {
          ctx.fillText(
            line,
            element.x,
            element.y + index * element.fontSize * 1.2
          );
        });

        if (isSelected) {
          const totalHeight = lines.length * element.fontSize * 1.2;

          ctx.strokeStyle = "#ff4757";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            element.x - 2,
            element.y - 2,
            maxWidth + 4,
            totalHeight + 4
          );
          ctx.setLineDash([]);

          ctx.fillStyle = "#ff4757";
          ctx.fillRect(element.x + maxWidth - 4, element.y + 10, 8, 8);
        }
      }

      ctx.restore();
    },
    [getResizeHandles]
  );

  // Render canvas
  const render = useCallback(() => {
    console.log("🖼️ render called");
    if (!ctx) return;

    ctx.clearRect(0, 0, 800, 500);

    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, 800, 500);
    } else {
      ctx.fillStyle = "#2c2c54";
      ctx.fillRect(0, 0, 800, 500);
    }

    elements.forEach((element) => {
      const isSelected = selectedElement && selectedElement.id === element.id;
      drawElement(ctx, element, isSelected);
    });
  }, [ctx, elements, selectedElement, backgroundImage, drawElement]);

  // Initialize canvas
  useEffect(() => {
    console.log("🎯 Canvas initialization useEffect");
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 500;
    const context = canvas.getContext("2d");
    setCtx(context);

    if (!context.roundRect) {
      context.roundRect = function (x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(
          x + width,
          y + height,
          x + width - radius,
          y + height
        );
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }

    parseTemplate(adHtmlTemplate);
  }, [parseTemplate]);

  // Render when dependencies change
  useEffect(() => {
    console.log("🎨 Render useEffect triggered");
    render();
  }, [render]);

  // Keyboard shortcuts
  useEffect(() => {
    console.log("⌨️ Keyboard shortcuts useEffect");
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      console.log("🧹 Cleaning up keyboard shortcuts");
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [undo, redo]);

  // Background image upload handler
  const handleBackgroundImageChange = useCallback(
    (e) => {
      console.log("📁 handleBackgroundImageChange called");
      const file = e.target.files[0];
      if (!file) {
        console.log("❌ No file selected");
        return;
      }

      console.log("📎 File selected:", file.name);
      const reader = new FileReader();

      reader.onload = (event) => {
        console.log("📖 FileReader onload triggered");
        const img = new Image();

        img.onload = () => {
          console.log("🖼️ New background image loaded successfully");
          setBackgroundImage(img);
          // Save to history after image loads
          saveToHistory(elements, img);
        };

        img.onerror = () => {
          console.log("❌ Failed to load new background image");
          setBackgroundImage(null);
          saveToHistory(elements, null);
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        console.log("❌ FileReader error");
      };

      reader.readAsDataURL(file);

      // Reset the input value so the same file can be selected again
      e.target.value = "";
    },
    [elements, saveToHistory]
  );

  // Generate HTML template
  const generateHtmlTemplate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return "";

    // Create a container div with the canvas dimensions
    let html = `<div id="ad-template" style="width: ${canvas.width}px; height: ${canvas.height}px; position: relative; overflow: hidden; background-color: #2c2c54;">`;

    // Add background image if exists
    if (backgroundImage) {
      html += `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${backgroundImage.src}'); background-size: cover; background-position: center;"></div>`;
    }

    // Add all elements
    elements.forEach((element) => {
      if (element.type === "button") {
        html += `
          <button style="
            position: absolute;
            left: ${element.x}px;
            top: ${element.y}px;
            width: ${element.width}px;
            height: ${element.height}px;
            font-family: ${element.fontFamily};
            font-size: ${element.fontSize}px;
            font-weight: ${element.fontWeight};
            font-style: ${element.fontStyle};
            color: ${element.color};
            background-color: ${element.backgroundColor};
            border-radius: ${element.borderRadius}px;
            padding: ${element.padding}px;
            border: none;
            cursor: pointer;
          ">
            ${element.text}
          </button>
        `;
      } else {
        html += `
          <div style="
            position: absolute;
            left: ${element.x}px;
            top: ${element.y}px;
            max-width: ${element.maxWidth}px;
            font-family: ${element.fontFamily};
            font-size: ${element.fontSize}px;
            font-weight: ${element.fontWeight};
            font-style: ${element.fontStyle};
            color: ${element.color};
            background-color: ${element.backgroundColor};
            border-radius: ${element.borderRadius}px;
            padding: ${element.padding}px;
          ">
            ${element.text}
          </div>
        `;
      }
    });

    html += `</div>`;
    return html;
  }, [elements, backgroundImage]);

  // Handle save to library
  const handleSaveToLibrary = useCallback(() => {
    const htmlTemplate = generateHtmlTemplate();
    console.log("HTML Template to save:", htmlTemplate);
    // Here you would typically make an API call to save the template
    alert("Template saved to console (check developer tools)");
  }, [generateHtmlTemplate]);

  const handleImageSelect = (img) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      setBackgroundImage(image);
      saveToHistory(elements, image);
      setShowModal(false);
    };
    image.onerror = () => {
      setBackgroundImage(null);
      saveToHistory(elements, null);
      setShowModal(false);
    };
    image.src = `https://images.unsplash.com/photo-1500000000000?w=800&h=500&fit=crop&crop=center`;
  };

  const getResizeHandleAt = useCallback(
    (x, y, element) => {
      console.log("🎯 getResizeHandleAt called");
      if (!element) return null;

      const handles = getResizeHandles(element);
      return handles.find(
        (handle) =>
          x >= handle.x &&
          x <= handle.x + handle.width &&
          y >= handle.y &&
          y <= handle.y + handle.height
      );
    },
    [getResizeHandles]
  );

  // Mouse event handlers
  const handleCanvasMouseDown = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // First check for resize handle
      if (selectedElement) {
        const handles = getResizeHandles(selectedElement);
        const handle = handles.find(
          (h) =>
            x >= h.x && x <= h.x + h.width && y >= h.y && y <= h.y + h.height
        );

        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          canvas.style.cursor = "nwse-resize";
          return;
        }
      }

      // Then check for element selection
      const clickedElement = [...elements].reverse().find((element) => {
        if (element.type === "button") {
          return (
            x >= element.x &&
            x <= element.x + element.width &&
            y >= element.y &&
            y <= element.y + element.height
          );
        } else {
          const width = element.width || 300;
          const lines = Math.ceil(element.text.split(" ").length / 3);
          const height = lines * element.fontSize * 1.2;
          return (
            x >= element.x &&
            x <= element.x + width &&
            y >= element.y &&
            y <= element.y + height
          );
        }
      });

      if (clickedElement) {
        setSelectedElement(clickedElement);
        setIsDragging(true);
        setDragOffset({
          x: x - clickedElement.x,
          y: y - clickedElement.y,
        });
        canvas.style.cursor = "grabbing";
      } else {
        setSelectedElement(null);
      }
    },
    [elements, selectedElement, getResizeHandles]
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isResizing && selectedElement && resizeHandle) {
        let newWidth, newHeight;

        if (selectedElement.type === "button") {
          newWidth = Math.max(50, x - selectedElement.x);
          newHeight = Math.max(20, y - selectedElement.y);
        } else {
          newWidth = Math.max(100, Math.min(600, x - selectedElement.x));
        }

        const updatedElement = {
          ...selectedElement,
          width: newWidth,
          ...(selectedElement.type === "button" && { height: newHeight }),
        };

        // Update elements array
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElement.id ? updatedElement : el))
        );

        // Update selected element reference
        setSelectedElement(updatedElement);

        canvas.style.cursor = "nwse-resize";
      } else if (isDragging && selectedElement) {
        const newX = Math.max(
          0,
          Math.min(800 - (selectedElement.width || 300), x - dragOffset.x)
        );
        const newY = Math.max(
          0,
          Math.min(500 - (selectedElement.height || 50), y - dragOffset.y)
        );

        const updatedElement = { ...selectedElement, x: newX, y: newY };

        setElements((prev) =>
          prev.map((el) => (el.id === selectedElement.id ? updatedElement : el))
        );
        setSelectedElement(updatedElement);
      } else {
        let cursor = "default";

        if (selectedElement) {
          const handles = getResizeHandles(selectedElement);
          const overHandle = handles.find(
            (h) =>
              x >= h.x && x <= h.x + h.width && y >= h.y && y <= h.y + h.height
          );

          if (overHandle) {
            cursor = "nwse-resize";
          } else {
            const overElement = elements.find(
              (el) => el.id === selectedElement.id
            );
            if (overElement) cursor = "grab";
          }
        }

        canvas.style.cursor = cursor;
      }
    },
    [
      isDragging,
      isResizing,
      selectedElement,
      dragOffset,
      resizeHandle,
      elements,
      getResizeHandles,
    ]
  );

  // Save history after drag/resize operations
  const handleCanvasMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      // Save to history after completing drag or resize operation
      saveToHistory(elements, backgroundImage);
    }

    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);

    const canvas = canvasRef.current;
    canvas.style.cursor = selectedElement ? "grab" : "default";
  }, [
    isDragging,
    isResizing,
    elements,
    backgroundImage,
    saveToHistory,
    selectedElement,
  ]);

  const handleCanvasDoubleClick = useCallback(
    (e) => {
      console.log("🖱️ handleCanvasDoubleClick");
      if (selectedElement && !isDragging && !isResizing) {
        setIsEditing(true);
        setEditingText(selectedElement.text);
      }
    },
    [selectedElement, isDragging, isResizing]
  );

  // OPTIMIZED: Update selected element property - handles different properties differently
  const updateSelectedElement = useCallback(
    (property, value) => {
      console.log(`⚙️ updateSelectedElement: ${property} = ${value}`);
      if (!selectedElement) return;

      const newElements = elements.map((element) =>
        element.id === selectedElement.id
          ? { ...element, [property]: value }
          : element
      );

      setElements(newElements);
      setSelectedElement((prev) => ({ ...prev, [property]: value }));

      // For fontSize, borderRadius, and color properties, don't save to history immediately
      // History will be saved when user releases the control
      if (
        !["fontSize", "borderRadius", "color", "backgroundColor"].includes(
          property
        )
      ) {
        // Save to history for other property changes (debounced)
        clearTimeout(updateSelectedElement.timeoutId);
        updateSelectedElement.timeoutId = setTimeout(() => {
          saveToHistory(newElements, backgroundImage);
        }, 300);
      }
    },
    [selectedElement, elements, backgroundImage, saveToHistory]
  );

  // OPTIMIZED: Font size change handlers
  const handleFontSizeChange = useCallback(
    (value, isComplete = false) => {
      console.log(`📏 handleFontSizeChange: ${value}, complete: ${isComplete}`);
      if (!selectedElement) return;

      const size = parseInt(value);

      // Update the local state immediately for real-time feedback
      setFontSize(size);

      // Update the element
      const newElements = elements.map((element) =>
        element.id === selectedElement.id
          ? { ...element, fontSize: size }
          : element
      );

      setElements(newElements);
      setSelectedElement((prev) => ({ ...prev, fontSize: size }));

      // Only save to history when the font size selection is complete
      if (isComplete) {
        console.log(`💾 Saving font size change to history: ${size}`);
        saveToHistory(newElements, backgroundImage);
        setIsChangingFontSize(false);
      } else {
        setIsChangingFontSize(true);
        // Clear any existing timeout to prevent multiple saves
        if (fontSizeTimeoutRef.current) {
          clearTimeout(fontSizeTimeoutRef.current);
        }

        // Set a timeout to save if user stops changing font size for 1 second
        fontSizeTimeoutRef.current = setTimeout(() => {
          console.log(
            `💾 Auto-saving font size change to history after timeout: ${size}`
          );
          saveToHistory(newElements, backgroundImage);
          setIsChangingFontSize(false);
        }, 1000);
      }
    },
    [selectedElement, elements, backgroundImage, saveToHistory]
  );

  // OPTIMIZED: Border radius change handlers
  const handleBorderRadiusChange = useCallback(
    (value, isComplete = false) => {
      console.log(
        `🔄 handleBorderRadiusChange: ${value}, complete: ${isComplete}`
      );
      if (!selectedElement) return;

      const radius = parseInt(value);

      // Update the local state immediately for real-time feedback
      setBorderRadius(radius);

      // Update the element
      const newElements = elements.map((element) =>
        element.id === selectedElement.id
          ? { ...element, borderRadius: radius }
          : element
      );

      setElements(newElements);
      setSelectedElement((prev) => ({ ...prev, borderRadius: radius }));

      // Only save to history when the border radius selection is complete
      if (isComplete) {
        console.log(`💾 Saving border radius change to history: ${radius}`);
        saveToHistory(newElements, backgroundImage);
        setIsChangingBorderRadius(false);
      } else {
        setIsChangingBorderRadius(true);
        // Clear any existing timeout to prevent multiple saves
        if (borderRadiusTimeoutRef.current) {
          clearTimeout(borderRadiusTimeoutRef.current);
        }

        // Set a timeout to save if user stops changing border radius for 1 second
        borderRadiusTimeoutRef.current = setTimeout(() => {
          console.log(
            `💾 Auto-saving border radius change to history after timeout: ${radius}`
          );
          saveToHistory(newElements, backgroundImage);
          setIsChangingBorderRadius(false);
        }, 1000);
      }
    },
    [selectedElement, elements, backgroundImage, saveToHistory]
  );

  // OPTIMIZED: Color change handlers that save to history only when done
  const handleColorChange = useCallback(
    (property, value, isComplete = false) => {
      console.log(
        `🎨 handleColorChange: ${property} = ${value}, complete: ${isComplete}`
      );
      if (!selectedElement) return;

      // Update the local state immediately for real-time feedback
      if (property === "color") {
        setTextColor(value);
      } else if (property === "backgroundColor") {
        setBackgroundColor(value);
      }

      // Update the element
      const newElements = elements.map((element) =>
        element.id === selectedElement.id
          ? { ...element, [property]: value }
          : element
      );

      setElements(newElements);
      setSelectedElement((prev) => ({ ...prev, [property]: value }));

      // Only save to history when the color selection is complete
      if (isComplete) {
        console.log(
          `💾 Saving color change to history: ${property} = ${value}`
        );
        saveToHistory(newElements, backgroundImage);
        setIsChangingColor(false);
      } else {
        setIsChangingColor(true);
        // Clear any existing timeout to prevent multiple saves
        if (colorChangeTimeoutRef.current) {
          clearTimeout(colorChangeTimeoutRef.current);
        }

        // Set a timeout to save if user stops changing color for 500ms
        colorChangeTimeoutRef.current = setTimeout(() => {
          console.log(
            `💾 Auto-saving color change to history after timeout: ${property} = ${value}`
          );
          saveToHistory(newElements, backgroundImage);
          setIsChangingColor(false);
        }, 500);
      }
    },
    [selectedElement, elements, backgroundImage, saveToHistory]
  );

  // Add text element
  const addTextElement = useCallback(() => {
    console.log("➕ addTextElement");
    const newElement = {
      id: `element-${Date.now()}`,
      type: "text",
      text: "New Text",
      x: 100,
      y: 100,
      fontSize: 20,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#ffffff",
      backgroundColor: "transparent",
      borderRadius: 0,
      padding: 0,
      width: 300,
      height: null,
      maxWidth: 400,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement);
    updateEditorControls(newElement);
    saveToHistory(newElements, backgroundImage);
  }, [elements, backgroundImage, updateEditorControls, saveToHistory]);

  // Add button element
  const addButtonElement = useCallback(() => {
    console.log("🔘 addButtonElement");
    const newElement = {
      id: `element-${Date.now()}`,
      type: "button",
      text: "New Button",
      x: 150,
      y: 150,
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "bold",
      fontStyle: "normal",
      color: "#ffffff",
      backgroundColor: "#ff4757",
      borderRadius: 8,
      padding: 12,
      width: 150,
      height: 40,
      maxWidth: 150,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement);
    updateEditorControls(newElement);
    saveToHistory(newElements, backgroundImage);
  }, [elements, backgroundImage, updateEditorControls, saveToHistory]);

  // Delete selected element
  const deleteSelected = useCallback(() => {
    console.log("🗑️ deleteSelected");
    if (!selectedElement) return;

    const newElements = elements.filter(
      (element) => element.id !== selectedElement.id
    );
    setElements(newElements);
    setSelectedElement(null);
    resetEditorControls();
    saveToHistory(newElements, backgroundImage);
  }, [
    selectedElement,
    elements,
    backgroundImage,
    resetEditorControls,
    saveToHistory,
  ]);

  // Handle text edit
  const handleTextEdit = useCallback(() => {
    console.log("✏️ handleTextEdit");
    if (selectedElement && editingText.trim()) {
      const newElements = elements.map((element) =>
        element.id === selectedElement.id
          ? { ...element, text: editingText }
          : element
      );

      setElements(newElements);
      setSelectedElement((prev) => ({ ...prev, text: editingText }));

      // Save to history after text edit
      saveToHistory(newElements, backgroundImage);
    }
    setIsEditing(false);
    setEditingText("");
  }, [selectedElement, editingText, elements, backgroundImage, saveToHistory]);

  // Export canvas
  const exportCanvas = useCallback(() => {
    console.log("📥 exportCanvas");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = "ad-template.png";
    link.href = dataURL;
    link.click();
  }, []);

  return (
    <div
      style={{
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)",
        color: "#ffffff",
        padding: 0,
        margin: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg, #ff4757 0%, #ff3838 100%)",
          padding: "15px 30px",
          borderBottom: "1px solid #3d3d56",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              background: "linear-gradient(45deg, #ffffff, #f1f2f6)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🎨 Ad Template Editor
          </h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: 12 }}>
            Create stunning advertisements with our professional editor
          </p>
        </div>

        {/* Header Controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            style={{
              padding: "8px 16px",
              background:
                historyIndex <= 0
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.9)",
              color: historyIndex <= 0 ? "#999" : "#333",
              border: "none",
              borderRadius: 6,
              cursor: historyIndex <= 0 ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ↶ Undo ({historyIndex})
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            style={{
              padding: "8px 16px",
              background:
                historyIndex >= history.length - 1
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.9)",
              color: historyIndex >= history.length - 1 ? "#999" : "#333",
              border: "none",
              borderRadius: 6,
              cursor:
                historyIndex >= history.length - 1 ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ↷ Redo ({history.length - 1})
          </button>

          <button
            onClick={resetTemplate}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.9)",
              color: "#333",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🔄 Reset
          </button>

          <button
            onClick={handleSaveToLibrary}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #ffa502 0%, #ff7f50 100%)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            💾 Save to Library
          </button>

          <button
            onClick={exportCanvas}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #2ed573 0%, #17a2b8 100%)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📥 Export
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "80px",
          height: "calc(100vh - 80px)",
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: 320,
            background: "linear-gradient(180deg, #2c2c54 0%, #40407a 100%)",
            borderRight: "1px solid #3d3d56",
            padding: 20,
            overflowY: "auto",
            position: "fixed",
            left: 0,
            top: "80px",
            height: "calc(100vh - 80px)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "2px solid #ff4757",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ff4757",
                  marginRight: 10,
                }}
              ></div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Background
              </h3>
            </div>
            <div
              style={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.05)",
                border: "2px dashed #5f5f8a",
                borderRadius: 8,
                padding: 16,
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => {
                console.log("Upload box clicked");
                setShowModal(true);
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>📁</div>
              <div style={{ fontSize: 12, color: "#a4b0be" }}>
                Click to upload background
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "2px solid #ff4757",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ff4757",
                  marginRight: 10,
                }}
              ></div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                Add Elements
              </h3>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={addTextElement}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background:
                    "linear-gradient(135deg, #3742fa 0%, #2f3542 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
              >
                ✏️ Text
              </button>
              <button
                onClick={addButtonElement}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background:
                    "linear-gradient(135deg, #ff4757 0%, #ff3838 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
              >
                🔘 Button
              </button>
            </div>
          </div>

          {selectedElement && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "2px solid #ff4757",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ff4757",
                    marginRight: 10,
                  }}
                ></div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                  {selectedElement.type === "button" ? "🔘" : "✏️"} PROPERTIES
                </h3>
              </div>

              {isEditing ? (
                <div
                  style={{
                    marginBottom: 16,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      marginBottom: 6,
                      color: "#a4b0be",
                      fontWeight: 600,
                    }}
                  >
                    EDIT CONTENT
                  </label>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleTextEdit()}
                    style={{
                      width: "100%",
                      padding: 10,
                      marginBottom: 10,
                      borderRadius: 6,
                      border: "2px solid #5f5f8a",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      fontSize: 12,
                      outline: "none",
                    }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={handleTextEdit}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        background:
                          "linear-gradient(135deg, #2ed573 0%, #1e90ff 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        background:
                          "linear-gradient(135deg, #ff4757 0%, #ff3838 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginBottom: 16,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditingText(selectedElement.text);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background:
                        "linear-gradient(135deg, #17a2b8 0%, #007bff 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✏️ Edit Text
                  </button>
                </div>
              )}

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                {/* OPTIMIZED: Font Size Slider */}
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      marginBottom: 6,
                      color: "#a4b0be",
                      fontWeight: 600,
                    }}
                  >
                    FONT SIZE: {fontSize}px{" "}
                    {isChangingFontSize && "(changing...)"}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) =>
                      handleFontSizeChange(e.target.value, false)
                    }
                    onMouseUp={(e) =>
                      handleFontSizeChange(e.target.value, true)
                    }
                    onTouchEnd={(e) =>
                      handleFontSizeChange(e.target.value, true)
                    }
                    style={{
                      width: "100%",
                      background: "#ff4757",
                      borderRadius: 3,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      marginBottom: 6,
                      color: "#a4b0be",
                      fontWeight: 600,
                    }}
                  >
                    FONT FAMILY
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      updateSelectedElement("fontFamily", e.target.value);
                    }}
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "2px solid #5f5f8a",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      fontSize: 12,
                    }}
                  >
                    <option
                      value="Arial"
                      style={{ background: "#2c2c54", color: "#ffffff" }}
                    >
                      Arial
                    </option>
                    <option
                      value="Georgia"
                      style={{ background: "#2c2c54", color: "#ffffff" }}
                    >
                      Georgia
                    </option>
                    <option
                      value="Times New Roman"
                      style={{ background: "#2c2c54", color: "#ffffff" }}
                    >
                      Times New Roman
                    </option>
                    <option
                      value="Courier New"
                      style={{ background: "#2c2c54", color: "#ffffff" }}
                    >
                      Courier New
                    </option>
                    <option
                      value="Helvetica"
                      style={{ background: "#2c2c54", color: "#ffffff" }}
                    >
                      Helvetica
                    </option>
                    <option
                      value="Verdana"
                      style={{ background: "#2c2c54", color: "#ffffff" }}
                    >
                      Verdana
                    </option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      marginBottom: 6,
                      color: "#a4b0be",
                      fontWeight: 600,
                    }}
                  >
                    FONT STYLE
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        const newWeight =
                          fontWeight === "bold" ? "normal" : "bold";
                        setFontWeight(newWeight);
                        updateSelectedElement("fontWeight", newWeight);
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        background:
                          fontWeight === "bold"
                            ? "linear-gradient(135deg, #ff4757 0%, #ff3838 100%)"
                            : "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      B
                    </button>
                    <button
                      onClick={() => {
                        const newStyle =
                          fontStyle === "italic" ? "normal" : "italic";
                        setFontStyle(newStyle);
                        updateSelectedElement("fontStyle", newStyle);
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        background:
                          fontStyle === "italic"
                            ? "linear-gradient(135deg, #ff4757 0%, #ff3838 100%)"
                            : "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontStyle: "italic",
                        fontSize: 12,
                      }}
                    >
                      I
                    </button>
                  </div>
                </div>

                {/* OPTIMIZED: Text Color Picker */}
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      marginBottom: 6,
                      color: "#a4b0be",
                      fontWeight: 600,
                    }}
                  >
                    TEXT COLOR {isChangingColor && "(changing...)"}
                  </label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) =>
                      handleColorChange("color", e.target.value, false)
                    }
                    onBlur={(e) =>
                      handleColorChange("color", e.target.value, true)
                    }
                    onMouseUp={(e) =>
                      handleColorChange("color", e.target.value, true)
                    }
                    style={{
                      width: "100%",
                      height: 35,
                      border: "2px solid #5f5f8a",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                    }}
                  />
                </div>

                {selectedElement.type === "button" && (
                  <>
                    {/* OPTIMIZED: Background Color Picker */}
                    <div style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          marginBottom: 6,
                          color: "#a4b0be",
                          fontWeight: 600,
                        }}
                      >
                        BACKGROUND COLOR {isChangingColor && "(changing...)"}
                      </label>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) =>
                          handleColorChange(
                            "backgroundColor",
                            e.target.value,
                            false
                          )
                        }
                        onBlur={(e) =>
                          handleColorChange(
                            "backgroundColor",
                            e.target.value,
                            true
                          )
                        }
                        onMouseUp={(e) =>
                          handleColorChange(
                            "backgroundColor",
                            e.target.value,
                            true
                          )
                        }
                        style={{
                          width: "100%",
                          height: 35,
                          border: "2px solid #5f5f8a",
                          borderRadius: 6,
                          background: "rgba(255, 255, 255, 0.1)",
                          cursor: "pointer",
                        }}
                      />
                    </div>

                    {/* OPTIMIZED: Border Radius Slider */}
                    <div style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          marginBottom: 6,
                          color: "#a4b0be",
                          fontWeight: 600,
                        }}
                      >
                        BORDER RADIUS: {borderRadius}px{" "}
                        {isChangingBorderRadius && "(changing...)"}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={borderRadius}
                        onChange={(e) =>
                          handleBorderRadiusChange(e.target.value, false)
                        }
                        onMouseUp={(e) =>
                          handleBorderRadiusChange(e.target.value, true)
                        }
                        onTouchEnd={(e) =>
                          handleBorderRadiusChange(e.target.value, true)
                        }
                        style={{
                          width: "100%",
                          background: "#ff4757",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={deleteSelected}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background:
                      "linear-gradient(135deg, #ff4757 0%, #c44569 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginTop: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  🗑️ Delete Element
                </button>
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: 20,
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: "#1e1e2f",
                padding: 20,
                borderRadius: 12,
                width: "100%",
                maxWidth: 1000,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {buttonLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => setActiveSection(label)}
                    style={{
                      padding: "6px 12px",
                      background:
                        activeSection === label
                          ? "#ff4757"
                          : "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  paddingTop: 16,
                }}
              >
                {renderContent()}
              </div>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div
          style={{
            marginLeft: "60px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            position: "fixed",
            left: "320px",
            right: 0,
            top: "80px",
            height: "calc(100vh - 80px)",
            background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)",
          }}
        >
          <div
            style={{
              border: "3px solid #ff4757",
              borderRadius: 12,
              width: 800,
              height: 500,
              boxShadow: "0 10px 30px rgba(255, 71, 87, 0.3)",
              position: "relative",
              backgroundColor: "#2c2c54",
              overflow: "hidden",
            }}
          >
            <canvas
              id="canvas"
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              style={{
                cursor: "default",
                display: "block",
                borderRadius: 8,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 15,
              fontSize: 12,
              color: "#a4b0be",
              textAlign: "center",
              maxWidth: 600,
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #5f5f8a",
              }}
            >
              💡 <strong style={{ color: "#ffffff" }}>How to use:</strong> Click
              and drag to move elements • Drag red handles to resize •
              Double-click to edit text • Use Ctrl+Z/Ctrl+Y for undo/redo •
              Sliders & color pickers save when you release them or click
              elsewhere
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
