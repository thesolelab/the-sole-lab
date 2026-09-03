/* ======================================================
   THE SOLE LAB
   NBA 2K SHOE RECIPE TRACKER
====================================================== */


/* ======================================================
   DOM ELEMENTS
====================================================== */

const shoeNameInput = document.getElementById("shoeName");
const brandInput = document.getElementById("brand");
const modelInput = document.getElementById("model");
const gameVersionSelect = document.getElementById("gameVersion");

const componentsContainer =
  document.getElementById("componentsContainer");

const addComponentBtn =
  document.getElementById("addComponentBtn");

const saveShoeBtn =
  document.getElementById("saveShoeBtn");

const clearFormBtn =
  document.getElementById("clearFormBtn");

const savedShoesContainer =
  document.getElementById("savedShoesContainer");


/* ======================================================
   APP STATE
====================================================== */

let editingShoeId = null;


/* ======================================================
   STORAGE
====================================================== */

const STORAGE_KEY = "soleLabShoes";


function getSavedShoes() {

  return JSON.parse(
    localStorage.getItem(STORAGE_KEY)
  ) || [];

}


function saveShoesToStorage(shoes) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(shoes)
  );

}


/* ======================================================
   COMPONENT CREATION
====================================================== */

function createComponentRow(component = {}) {

  const componentCard = document.createElement("div");

  componentCard.className = "component-card";


  componentCard.innerHTML = `

    <div class="component-card-header">

      <h3>Shoe Component</h3>

      <button
        type="button"
        class="remove-component-btn"
      >
        Remove
      </button>

    </div>


    <div class="component-grid">

      <div class="field-group">

        <label>
          Component Name
        </label>

        <input
          type="text"
          class="component-name"
          placeholder="Example: Base"
          value="${component.name || ""}"
        />

      </div>


      <div class="field-group">

        <label>
          Material
        </label>

        <input
          type="text"
          class="component-material"
          placeholder="Example: Mesh"
          value="${component.material || ""}"
        />

      </div>


      <div class="field-group">

        <label>
          Pattern
        </label>

        <input
          type="text"
          class="component-pattern"
          placeholder="Example: 27"
          value="${component.pattern || ""}"
        />

      </div>


      <div class="field-group">

        <label>
          Hue
        </label>

        <input
          type="number"
          class="component-hue"
          placeholder="0"
          value="${component.hue ?? ""}"
        />

      </div>


      <div class="field-group">

        <label>
          Saturation
        </label>

        <input
          type="number"
          class="component-saturation"
          placeholder="0"
          value="${component.saturation ?? ""}"
        />

      </div>


      <div class="field-group">

        <label>
          Brightness
        </label>

        <input
          type="number"
          class="component-brightness"
          placeholder="0"
          value="${component.brightness ?? ""}"
        />

      </div>


      <div class="field-group field-full">

        <label>
          Notes
        </label>

        <input
          type="text"
          class="component-notes"
          placeholder="Optional notes"
          value="${component.notes || ""}"
        />

      </div>

    </div>

  `;


  const removeBtn =
    componentCard.querySelector(
      ".remove-component-btn"
    );


  removeBtn.addEventListener(
    "click",
    function () {

      componentCard.remove();

    }
  );


  componentsContainer.appendChild(
    componentCard
  );

}


/* ======================================================
   READ COMPONENT VALUES
====================================================== */

function getComponentValues() {

  const componentCards =
    document.querySelectorAll(
      ".component-card"
    );


  return Array.from(componentCards)
    .map(card => {

      return {

        name:
          card.querySelector(
            ".component-name"
          ).value.trim(),

        material:
          card.querySelector(
            ".component-material"
          ).value.trim(),

        pattern:
          card.querySelector(
            ".component-pattern"
          ).value.trim(),

        hue:
          card.querySelector(
            ".component-hue"
          ).value,

        saturation:
          card.querySelector(
            ".component-saturation"
          ).value,

        brightness:
          card.querySelector(
            ".component-brightness"
          ).value,

        notes:
          card.querySelector(
            ".component-notes"
          ).value.trim()

      };

    })
    .filter(component => component.name);

}


/* ======================================================
   SAVE SHOE
====================================================== */

function saveShoe() {

  const shoeName =
    shoeNameInput.value.trim();


  if (!shoeName) {

    alert(
      "Enter a shoe name before saving."
    );

    return;

  }


  const components =
    getComponentValues();


  if (components.length === 0) {

    alert(
      "Add at least one shoe component."
    );

    return;

  }


  const shoes =
    getSavedShoes();


  const shoe = {

    id:
      editingShoeId ||
      `shoe-${Date.now()}`,

    name:
      shoeName,

    brand:
      brandInput.value.trim(),

    model:
      modelInput.value.trim(),

    gameVersion:
      gameVersionSelect.value,

    components:
      components,

    updatedAt:
      new Date().toISOString()

  };


  if (editingShoeId) {

    const shoeIndex =
      shoes.findIndex(
        savedShoe =>
          savedShoe.id === editingShoeId
      );


    if (shoeIndex !== -1) {

      shoes[shoeIndex] = shoe;

    }

  }

  else {

    shoes.push(shoe);

  }


  saveShoesToStorage(shoes);

  resetForm();

  renderSavedShoes();

}


/* ======================================================
   LOAD SHOE FOR EDITING
====================================================== */

function editShoe(shoeId) {

  const shoes =
    getSavedShoes();


  const shoe =
    shoes.find(
      savedShoe =>
        savedShoe.id === shoeId
    );


  if (!shoe) {

    return;

  }


  editingShoeId =
    shoe.id;


  shoeNameInput.value =
    shoe.name || "";

  brandInput.value =
    shoe.brand || "";

  modelInput.value =
    shoe.model || "";

  gameVersionSelect.value =
    shoe.gameVersion || "NBA 2K27";


  componentsContainer.innerHTML =
    "";


  shoe.components.forEach(
    component => {

      createComponentRow(
        component
      );

    }
  );


  saveShoeBtn.textContent =
    "Update Shoe";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ======================================================
   DELETE SHOE
====================================================== */

function deleteShoe(shoeId) {

  const shoes =
    getSavedShoes();


  const updatedShoes =
    shoes.filter(
      shoe =>
        shoe.id !== shoeId
    );


  saveShoesToStorage(
    updatedShoes
  );


  renderSavedShoes();

}


/* ======================================================
   RESET FORM
====================================================== */

function resetForm() {

  editingShoeId = null;

  shoeNameInput.value = "";
  brandInput.value = "";
  modelInput.value = "";

  gameVersionSelect.value =
    "NBA 2K27";


  componentsContainer.innerHTML =
    "";


  createComponentRow();


  saveShoeBtn.textContent =
    "Save Shoe";

}


/* ======================================================
   RENDER SAVED SHOES
====================================================== */

function renderSavedShoes() {

  const shoes =
    getSavedShoes();


  savedShoesContainer.innerHTML =
    "";


  if (shoes.length === 0) {

    savedShoesContainer.innerHTML = `

      <div class="empty-state">

        No shoes saved yet.

      </div>

    `;

    return;

  }


  shoes.forEach(shoe => {

    const card =
      document.createElement("article");


    card.className =
      "saved-shoe-card";


    card.innerHTML = `

      <div>

        <span class="saved-version">
          ${shoe.gameVersion}
        </span>

        <h3>
          ${shoe.name}
        </h3>

        <p>
          ${shoe.brand || ""}
          ${shoe.model || ""}
        </p>

        <span class="component-count">
          ${shoe.components.length}
          ${
            shoe.components.length === 1
              ? "component"
              : "components"
          }
        </span>

      </div>


      <div class="saved-shoe-actions">

        <button
          type="button"
          class="button button-secondary edit-shoe"
        >
          Edit
        </button>

        <button
          type="button"
          class="button button-danger delete-shoe"
        >
          Delete
        </button>

      </div>

    `;


    card
      .querySelector(".edit-shoe")
      .addEventListener(
        "click",
        function () {

          editShoe(
            shoe.id
          );

        }
      );


    card
      .querySelector(".delete-shoe")
      .addEventListener(
        "click",
        function () {

          deleteShoe(
            shoe.id
          );

        }
      );


    savedShoesContainer.appendChild(
      card
    );

  });

}


/* ======================================================
   EVENT LISTENERS
====================================================== */

addComponentBtn.addEventListener(
  "click",
  function () {

    createComponentRow();

  }
);


saveShoeBtn.addEventListener(
  "click",
  saveShoe
);


clearFormBtn.addEventListener(
  "click",
  resetForm
);


/* ======================================================
   INITIALIZE APP
====================================================== */

createComponentRow();

renderSavedShoes();
