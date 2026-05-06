(function() {
  console.log("AO3 preset sidebar: main script starting");

  // -----------------------------
  // Storage
  // -----------------------------
  var STORAGE_KEY = "AO3_PRESET_DATA_V3";

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { categories: [], bundles: [] };
      var parsed = JSON.parse(raw);
      if (!parsed.categories) parsed.categories = [];
      if (!parsed.bundles) parsed.bundles = [];
      return parsed;
    } catch (e) {
      console.error("Failed to load preset data:", e);
      return { categories: [], bundles: [] };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save preset data:", e);
    }
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2);
  }

  // -----------------------------
  // AO3 form helpers
  // -----------------------------
  function $(sel) {
    return document.querySelector(sel);
  }

  function setValue(sel, val) {
    var el = $(sel);
    if (el) el.value = val;
  }

  function getTags(sel) {
    var el = $(sel);
    if (!el || !el.value) return [];
    return el.value.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
  }

  function setTags(sel, arr) {
    setValue(sel, (arr || []).join(", "));
  }

  function applyWarning(labelText) {
    var inputs = document.querySelectorAll("input[name='work[archive_warning_ids][]']");
    inputs.forEach(function(input) {
      var lab = input.nextElementSibling;
      var txt = lab ? lab.innerText.trim() : "";
      input.checked = (txt === labelText);
    });
  }

  function applyCategory(labelText) {
    var inputs = document.querySelectorAll("input[name='work[category_ids][]']");
    inputs.forEach(function(input) {
      var lab = input.nextElementSibling;
      var txt = lab ? lab.innerText.trim() : "";
      input.checked = (txt === labelText);
    });
  }

  function readPresetFromForm() {
    var ratingSel = $("#work_rating_string");
    var rating = ratingSel ? ratingSel.value : "";

    var warningChecked = document.querySelector("input[name='work[archive_warning_ids][]']:checked");
    var warningLabel = warningChecked && warningChecked.nextElementSibling ? warningChecked.nextElementSibling.innerText.trim() : "";

    var catChecked = document.querySelector("input[name='work[category_ids][]']:checked");
    var catLabel = catChecked && catChecked.nextElementSibling ? catChecked.nextElementSibling.innerText.trim() : "";

    var langSel = $("#work_language_id");
    var lang = langSel ? langSel.value : "";

    return {
      title: $("#work_title") ? $("#work_title").value : "",
      summary: $("#work_summary") ? $("#work_summary").value : "",
      notes: $("#work_notes") ? $("#work_notes").value : "",
      language: lang,
      rating: rating,
      warning: warningLabel,
      category: catLabel,
      fandoms: getTags("#work_fandom_string"),
      relationships: getTags("#work_relationship_string"),
      characters: getTags("#work_character_string"),
      tags: getTags("#work_freeform_string")
    };
  }

  // -----------------------------
  // Bundles
  // -----------------------------
  function expandBundles(tags, bundles) {
    var out = [];
    tags.forEach(function(t) {
      var m = t.match(/^\{bundle:\s*(.+?)\s*\}$/i);
      if (m) {
        var name = m[1];
        var b = bundles.find(function(bu) { return bu.name === name; });
        if (b) {
          b.tags.forEach(function(tag) { out.push(tag); });
        } else {
          out.push(t);
        }
      } else {
        out.push(t);
      }
    });
    return out;
  }

  function applyPresetToForm(preset, bundles) {
    if (!preset) return;
    setValue("#work_title", preset.title || "");
    setValue("#work_summary", preset.summary || "");
    setValue("#work_notes", preset.notes || "");

    var langSel = $("#work_language_id");
    if (langSel) langSel.value = preset.language || "";

    var ratingSel = $("#work_rating_string");
    if (ratingSel) ratingSel.value = preset.rating || "";

    if (preset.warning) applyWarning(preset.warning);
    if (preset.category) applyCategory(preset.category);

    setTags("#work_fandom_string", preset.fandoms || []);
    setTags("#work_relationship_string", preset.relationships || []);
    setTags("#work_character_string", preset.characters || []);

    var expandedTags = expandBundles(preset.tags || [], bundles || []);
    setTags("#work_freeform_string", expandedTags);
  }

  // -----------------------------
  // Sidebar CSS
  // -----------------------------
  function injectCSS() {
    var css =
      "#ao3-preset-sidebar{position:fixed;top:0;left:0;width:450px;height:100vh;background:#f8f8f8;border-right:1px solid #ccc;padding:6px;box-sizing:border-box;overflow-y:auto;z-index:9999;font-family:Verdana,sans-serif;font-size:0.9em;color:#333;}" +
      "#ao3-preset-sidebar-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}" +
      "#ao3-preset-sidebar-title{font-weight:bold;font-size:1em;}" +
      "#ao3-preset-chevron{background:none;border:none;cursor:pointer;padding:2px;}" +
      "#ao3-preset-chevron svg{width:14px;height:14px;fill:#666;}" +
      "#ao3-preset-inner{margin-top:4px;}" +
      "#ao3-preset-sidebar.collapsed{width:20px;padding:2px;overflow:hidden;}" +
      "#ao3-preset-sidebar.collapsed #ao3-preset-inner{display:none;}" +
      "body.ao3-preset-active #outer{margin-left:450px;}" +
      "body.ao3-preset-active.sidebar-collapsed #outer{margin-left:20px;}" +
      "#ao3-preset-resize{position:absolute;top:0;right:-3px;width:6px;height:100%;cursor:ew-resize;}" +
      ".ao3-section-title{font-weight:bold;margin-top:6px;margin-bottom:2px;}" +
      ".ao3-cat-item,.ao3-bundle-item{border:1px solid #ddd;background:#fff;padding:4px;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;}" +
      ".ao3-preset-item{border:1px solid #eee;background:#fafafa;padding:3px;margin:2px 0 2px 16px;display:flex;align-items:center;justify-content:space-between;}" +
      ".ao3-handle{cursor:grab;margin-right:4px;font-size:0.9em;color:#888;}" +
      ".ao3-left{display:flex;align-items:center;}" +
      ".ao3-name{margin-left:4px;}" +
      ".ao3-btn{font-size:0.75em;margin-left:3px;}" +
      ".ao3-icon{width:12px;height:12px;fill:#666;}" +
      ".ao3-import-input{display:none;}";

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // -----------------------------
  // SVG icons
  // -----------------------------
  function createSVGIcon(pathD) {
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.classList.add("ao3-icon");
    var path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathD);
    svg.appendChild(path);
    return svg;
  }

  function iconChevron() {
    return createSVGIcon("M6 3l5 5-5 5z");
  }

  function iconFolder() {
    return createSVGIcon("M2 3h4l2 2h6v8H2z");
  }

  function iconStar() {
    return createSVGIcon("M8 1l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z");
  }

  function iconTag() {
    return createSVGIcon("M2 2h6l6 6-6 6-6-6z");
  }

  // -----------------------------
  // Drag-and-drop state
  // -----------------------------
  var dragState = {
    type: null,   // "category" | "preset" | "bundle"
    catId: null,  // for preset
    id: null
  };

  // -----------------------------
  // Sidebar builder
  // -----------------------------
  function buildSidebar() {
    injectCSS();
    var data = loadData();

    var side = document.createElement("div");
    side.id = "ao3-preset-sidebar";

    var header = document.createElement("div");
    header.id = "ao3-preset-sidebar-header";

    var title = document.createElement("div");
    title.id = "ao3-preset-sidebar-title";
    title.textContent = "Preset Manager";

    var chevBtn = document.createElement("button");
    chevBtn.id = "ao3-preset-chevron";
    chevBtn.appendChild(iconChevron());

    header.appendChild(title);
    header.appendChild(chevBtn);

    var inner = document.createElement("div");
    inner.id = "ao3-preset-inner";

    // Categories section
    var catTitle = document.createElement("div");
    catTitle.className = "ao3-section-title";
    catTitle.textContent = "Categories";
    inner.appendChild(catTitle);

    var addCatBtn = document.createElement("button");
    addCatBtn.textContent = "Add Category";
    addCatBtn.className = "ao3-btn";
    inner.appendChild(addCatBtn);

    var catContainer = document.createElement("div");
    inner.appendChild(catContainer);

    // Bundles section
    var bunTitle = document.createElement("div");
    bunTitle.className = "ao3-section-title";
    bunTitle.textContent = "Smart Tag Bundles";
    inner.appendChild(bunTitle);

    var addBundleBtn = document.createElement("button");
    addBundleBtn.textContent = "Add Bundle";
    addBundleBtn.className = "ao3-btn";
    inner.appendChild(addBundleBtn);

    var bundleContainer = document.createElement("div");
    inner.appendChild(bundleContainer);

    // Import / Export
    var ioTitle = document.createElement("div");
    ioTitle.className = "ao3-section-title";
    ioTitle.textContent = "Import / Export";
    inner.appendChild(ioTitle);

    var exportBtn = document.createElement("button");
    exportBtn.textContent = "Export";
    exportBtn.className = "ao3-btn";

    var importBtn = document.createElement("button");
    importBtn.textContent = "Import";
    importBtn.className = "ao3-btn";

    var importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "application/json";
    importInput.className = "ao3-import-input";

    inner.appendChild(exportBtn);
    inner.appendChild(importBtn);
    inner.appendChild(importInput);

    side.appendChild(header);
    side.appendChild(inner);

    var resizeHandle = document.createElement("div");
    resizeHandle.id = "ao3-preset-resize";
    side.appendChild(resizeHandle);

    document.body.appendChild(side);
    document.body.classList.add("ao3-preset-active");

    // Collapse
    chevBtn.addEventListener("click", function() {
      var collapsed = side.classList.toggle("collapsed");
      document.body.classList.toggle("sidebar-collapsed", collapsed);
    });

    // Resize
    var resizing = false;
    resizeHandle.addEventListener("mousedown", function(e) {
      resizing = true;
      e.preventDefault();
    });
    document.addEventListener("mousemove", function(e) {
      if (!resizing) return;
      var w = e.clientX;
      if (w < 260) w = 260;
      if (w > 600) w = 600;
      side.style.width = w + "px";
      var outer = document.getElementById("outer");
      if (outer) outer.style.marginLeft = w + "px";
    });
    document.addEventListener("mouseup", function() {
      resizing = false;
    });

    // Render function
    function render() {
      data = loadData();
      catContainer.innerHTML = "";
      bundleContainer.innerHTML = "";

      // Sort by order
      data.categories.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
      data.bundles.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

      // Categories
      data.categories.forEach(function(cat) {
        var catBox = document.createElement("div");
        catBox.className = "ao3-cat-item";
        catBox.dataset.catId = cat.id;

        var left = document.createElement("div");
        left.className = "ao3-left";

        var handle = document.createElement("span");
        handle.className = "ao3-handle";
        handle.textContent = "⋮⋮";
        handle.draggable = true;
        handle.dataset.type = "category";
        handle.dataset.id = cat.id;

        var icon = iconFolder();
        var nameSpan = document.createElement("span");
        nameSpan.className = "ao3-name";
        nameSpan.textContent = cat.name;

        left.appendChild(handle);
        left.appendChild(icon);
        left.appendChild(nameSpan);

        var right = document.createElement("div");

        var addPresetBtn = document.createElement("button");
        addPresetBtn.textContent = "+Preset";
        addPresetBtn.className = "ao3-btn";

        var renameCatBtn = document.createElement("button");
        renameCatBtn.textContent = "Rename";
        renameCatBtn.className = "ao3-btn";

        var deleteCatBtn = document.createElement("button");
        deleteCatBtn.textContent = "Delete";
        deleteCatBtn.className = "ao3-btn";

        right.appendChild(addPresetBtn);
        right.appendChild(renameCatBtn);
        right.appendChild(deleteCatBtn);

        catBox.appendChild(left);
        catBox.appendChild(right);
        catContainer.appendChild(catBox);

        // Presets
        cat.presets = cat.presets || [];
        cat.presets.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

        cat.presets.forEach(function(preset) {
          var row = document.createElement("div");
          row.className = "ao3-preset-item";
          row.dataset.presetId = preset.id;
          row.dataset.catId = cat.id;

          var leftP = document.createElement("div");
          leftP.className = "ao3-left";

          var handleP = document.createElement("span");
          handleP.className = "ao3-handle";
          handleP.textContent = "⋮⋮";
          handleP.draggable = true;
          handleP.dataset.type = "preset";
          handleP.dataset.id = preset.id;
          handleP.dataset.catId = cat.id;

          var iconP = iconStar();
          var nameP = document.createElement("span");
          nameP.className = "ao3-name";
          nameP.textContent = preset.name;

          leftP.appendChild(handleP);
          leftP.appendChild(iconP);
          leftP.appendChild(nameP);

          var rightP = document.createElement("div");

          var applyBtn = document.createElement("button");
          applyBtn.textContent = "Apply";
          applyBtn.className = "ao3-btn";

          var editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.className = "ao3-btn";

          var delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.className = "ao3-btn";

          rightP.appendChild(applyBtn);
          rightP.appendChild(editBtn);
          rightP.appendChild(delBtn);

          row.appendChild(leftP);
          row.appendChild(rightP);
          catContainer.appendChild(row);

          applyBtn.addEventListener("click", function() {
            applyPresetToForm(preset.data, data.bundles);
          });

          editBtn.addEventListener("click", function() {
            var newName = window.prompt("Preset name:", preset.name);
            if (!newName) return;
            preset.name = newName;
            preset.data = readPresetFromForm();
            saveData(data);
            render();
          });

          delBtn.addEventListener("click", function() {
            if (!window.confirm("Delete this preset?")) return;
            cat.presets = cat.presets.filter(function(pr) { return pr.id !== preset.id; });
            saveData(data);
            render();
          });
        });

        addPresetBtn.addEventListener("click", function() {
          var name = window.prompt("Preset name:");
          if (!name) return;
          var newPreset = {
            id: uid("preset"),
            name: name,
            order: cat.presets.length,
            data: readPresetFromForm()
          };
          cat.presets.push(newPreset);
          saveData(data);
          render();
        });

        renameCatBtn.addEventListener("click", function() {
          var newName = window.prompt("Category name:", cat.name);
          if (!newName) return;
          cat.name = newName;
          saveData(data);
          render();
        });

        deleteCatBtn.addEventListener("click", function() {
          if (!window.confirm("Delete this category and all its presets?")) return;
          data.categories = data.categories.filter(function(c) { return c.id !== cat.id; });
          saveData(data);
          render();
        });
      });

      // Bundles
      data.bundles.forEach(function(bun) {
        var row = document.createElement("div");
        row.className = "ao3-bundle-item";
        row.dataset.bundleId = bun.id;

        var leftB = document.createElement("div");
        leftB.className = "ao3-left";

        var handleB = document.createElement("span");
        handleB.className = "ao3-handle";
        handleB.textContent = "⋮⋮";
        handleB.draggable = true;
        handleB.dataset.type = "bundle";
        handleB.dataset.id = bun.id;

        var iconB = iconTag();
        var nameB = document.createElement("span");
        nameB.className = "ao3-name";
        nameB.textContent = bun.name;

        leftB.appendChild(handleB);
        leftB.appendChild(iconB);
        leftB.appendChild(nameB);

        var rightB = document.createElement("div");

        var editB = document.createElement("button");
        editB.textContent = "Edit";
        editB.className = "ao3-btn";

        var delB = document.createElement("button");
        delB.textContent = "Delete";
        delB.className = "ao3-btn";

        rightB.appendChild(editB);
        rightB.appendChild(delB);

        row.appendChild(leftB);
        row.appendChild(rightB);
        bundleContainer.appendChild(row);

        editB.addEventListener("click", function() {
          var newName = window.prompt("Bundle name:", bun.name);
          if (!newName) return;
          var tagsStr = window.prompt("Tags (comma-separated):", bun.tags.join(", "));
          if (tagsStr === null) return;
          bun.name = newName;
          bun.tags = tagsStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
          saveData(data);
          render();
        });

        delB.addEventListener("click", function() {
          if (!window.confirm("Delete this bundle?")) return;
          data.bundles = data.bundles.filter(function(b) { return b.id !== bun.id; });
          saveData(data);
          render();
        });
      });
    }

    // Add category / bundle
    addCatBtn.addEventListener("click", function() {
      var name = window.prompt("Category name:");
      if (!name) return;
      var d = loadData();
      d.categories.push({
        id: uid("cat"),
        name: name,
        order: d.categories.length,
        presets: []
      });
      saveData(d);
      render();
    });

    addBundleBtn.addEventListener("click", function() {
      var name = window.prompt("Bundle name:");
      if (!name) return;
      var tagsStr = window.prompt("Tags (comma-separated):", "");
      if (tagsStr === null) return;
      var tags = tagsStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      var d = loadData();
      d.bundles.push({
        id: uid("bundle"),
        name: name,
        order: d.bundles.length,
        tags: tags
      });
      saveData(d);
      render();
    });

    // Import / Export
    exportBtn.addEventListener("click", function() {
      var d = loadData();
      var blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ao3-presets.json";
      a.click();
    });

    importBtn.addEventListener("click", function() {
      importInput.value = "";
      importInput.click();
    });

    importInput.addEventListener("change", function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var imported = JSON.parse(reader.result);
          if (!imported.categories) imported.categories = [];
          if (!imported.bundles) imported.bundles = [];
          saveData(imported);
          render();
        } catch (err) {
          window.alert("Failed to import JSON: " + err);
        }
      };
      reader.readAsText(file);
    });

    // Drag and drop
    side.addEventListener("dragstart", function(e) {
      var target = e.target;
      if (!target.classList.contains("ao3-handle")) return;
      var type = target.dataset.type;
      var id = target.dataset.id;
      var catId = target.dataset.catId || null;
      dragState.type = type;
      dragState.id = id;
      dragState.catId = catId;
      e.dataTransfer.effectAllowed = "move";
    });

    side.addEventListener("dragover", function(e) {
      if (!dragState.type) return;
      e.preventDefault();
    });

    side.addEventListener("drop", function(e) {
      if (!dragState.type) return;
      e.preventDefault();

      var target = e.target;
      while (target && target !== side) {
        if (dragState.type === "category" && target.classList.contains("ao3-cat-item")) break;
        if (dragState.type === "preset" && target.classList.contains("ao3-preset-item")) break;
        if (dragState.type === "bundle" && target.classList.contains("ao3-bundle-item")) break;
        target = target.parentElement;
      }
      if (!target || target === side) {
        dragState.type = null;
        dragState.id = null;
        dragState.catId = null;
        return;
      }

      var d = loadData();

      if (dragState.type === "category" && target.classList.contains("ao3-cat-item")) {
        var fromId = dragState.id;
        var toId = target.dataset.catId;
        if (fromId === toId) {
          dragState.type = null;
          dragState.id = null;
          dragState.catId = null;
          return;
        }
        var cats = d.categories;
        var fromIndex = cats.findIndex(function(c) { return c.id === fromId; });
        var toIndex = cats.findIndex(function(c) { return c.id === toId; });
        if (fromIndex >= 0 && toIndex >= 0) {
          var moved = cats.splice(fromIndex, 1)[0];
          cats.splice(toIndex, 0, moved);
          cats.forEach(function(c, idx) { c.order = idx; });
          saveData(d);
          render();
        }
      }

      if (dragState.type === "preset" && target.classList.contains("ao3-preset-item")) {
        var fromPresetId = dragState.id;
        var fromCatId = dragState.catId;
        var toPresetId = target.dataset.presetId;
        var toCatId = target.dataset.catId;

        if (!fromCatId || !toCatId) {
          dragState.type = null;
          dragState.id = null;
          dragState.catId = null;
          return;
        }

        var fromCat = d.categories.find(function(c) { return c.id === fromCatId; });
        var toCat = d.categories.find(function(c) { return c.id === toCatId; });
        if (!fromCat || !toCat) {
          dragState.type = null;
          dragState.id = null;
          dragState.catId = null;
          return;
        }

        var fromList = fromCat.presets || [];
        var toList = toCat.presets || [];

        var fromIdx = fromList.findIndex(function(p) { return p.id === fromPresetId; });
        var toIdx = toList.findIndex(function(p) { return p.id === toPresetId; });

        if (fromIdx < 0 || toIdx < 0) {
          dragState.type = null;
          dragState.id = null;
          dragState.catId = null;
          return;
        }

        var movedPreset = fromList.splice(fromIdx, 1)[0];
        toList.splice(toIdx, 0, movedPreset);

        fromList.forEach(function(p, idx) { p.order = idx; });
        if (fromCat !== toCat) {
          toList.forEach(function(p, idx) { p.order = idx; });
        }

        saveData(d);
        render();
      }

      if (dragState.type === "bundle" && target.classList.contains("ao3-bundle-item")) {
        var fromBId = dragState.id;
        var toBId = target.dataset.bundleId;
        if (fromBId === toBId) {
          dragState.type = null;
          dragState.id = null;
          dragState.catId = null;
          return;
        }
        var buns = d.bundles;
        var fromBIdx = buns.findIndex(function(b) { return b.id === fromBId; });
        var toBIdx = buns.findIndex(function(b) { return b.id === toBId; });
        if (fromBIdx >= 0 && toBIdx >= 0) {
          var movedB = buns.splice(fromBIdx, 1)[0];
          buns.splice(toBIdx, 0, movedB);
          buns.forEach(function(b, idx) { b.order = idx; });
          saveData(d);
          render();
        }
      }

      dragState.type = null;
      dragState.id = null;
      dragState.catId = null;
    });

    render();
  }

  // -----------------------------
  // Init on AO3 forms
  // -----------------------------
  function initIfOnWorkForm() {
    var form = document.querySelector("#new_work, form.edit_work");
    if (!form) return;
    buildSidebar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIfOnWorkForm);
  } else {
    initIfOnWorkForm();
  }
})();
