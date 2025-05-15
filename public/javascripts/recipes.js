document.addEventListener('DOMContentLoaded', async () => {
  const recipeSelect = document.getElementById('recipes');
  const nameElem = document.getElementById('name');
  const pictureElem = document.getElementById('picture');
  const ingredientsElem = document.getElementById('ingredients');
  const directionsElem = document.getElementById('directions-container');
  const hasRecipe = document.querySelector('.has-recipe');
  const noRecipe = document.querySelector('.no-recipe');
  const errorElem = document.getElementById('error');
  const deleteButton = document.getElementById('delete-recipe');
  const editButton = document.getElementById('edit-recipe');
  const addRecipeButton = document.getElementById('add-recipe-button');
  const homeButton = document.getElementById('home-button');
  const recipeFormContainer = document.getElementById('recipe-form-container');
  const recipeForm = document.getElementById('recipe-form');
  const cancelButton = document.getElementById('cancel-button');
  let isEditing = false;
  let currentRecipeId = null;

  homeButton.addEventListener('click', () => {
    window.location.href = '/';
  });

  async function loadJson(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      errorElem.textContent = error.message;
      hasRecipe.classList.add('hidden');
      noRecipe.classList.remove('hidden');
      updateButtonVisibility();
      return null;
    }
  }

  function updateButtonVisibility() {
    if (hasRecipe.classList.contains('hidden')) {
      deleteButton.classList.add('hidden');
      editButton.classList.add('hidden');
    } else {
      deleteButton.classList.remove('hidden');
      editButton.classList.remove('hidden');
    }
  }

  async function selectRecipe(event) {
    const recipeId = event.target.value;
    const recipe = await loadJson(`/recipes/${recipeId}`);
    if (!recipe) {
      return;
    }
    currentRecipeId = recipeId;
    noRecipe.classList.add('hidden');
    hasRecipe.classList.remove('hidden');
    nameElem.textContent = recipe.name;
    pictureElem.src = `/images/${recipe.picture}`;

    ingredientsElem.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
      const li = document.createElement('li');
      li.textContent = ingredient;
      ingredientsElem.appendChild(li);
    });

    directionsElem.innerHTML = '<h4>Directions:</h4>';
    const directions = recipe.directions.split('\n');
    directions.forEach(direction => {
      const p = document.createElement('p');
      p.textContent = direction;
      directionsElem.appendChild(p);
    });

    updateButtonVisibility();
  }

  editButton.onclick = () => {
    if (currentRecipeId) {
      isEditing = true;
      loadJson(`/recipes/${currentRecipeId}`).then(recipe => {
        document.getElementById('form-title').textContent = 'Edit Recipe';
        document.getElementById('recipe-name').value = recipe.name;
        document.getElementById('recipe-category').value = recipe.category;
        document.getElementById('recipe-ingredients').value = recipe.ingredients.join(', ');
        document.getElementById('recipe-directions').value = recipe.directions;
        recipeFormContainer.classList.remove('hidden');

        recipeFormContainer.scrollIntoView({ behavior: 'smooth' });

        deleteButton.classList.add('hidden');
        editButton.classList.add('hidden');
      });
    }
  };

  deleteButton.onclick = async () => {
    if (confirm(`Are you sure you want to delete ${nameElem.textContent}?`)) {
      await fetch(`/recipes/${currentRecipeId}`, { method: 'DELETE' });
      window.location.reload();
    }
  };

  async function submitRecipe(event) {
    event.preventDefault();
    const formData = new FormData(recipeForm);
    let ingredients = formData.get('ingredients');

    if (ingredients) {
      ingredients = ingredients.split(',').map(ingredient => ingredient.trim());
    } else {
      ingredients = [];
    }
    formData.set('ingredients', JSON.stringify(ingredients));

    const imageInput = document.getElementById('recipe-image');
    if (imageInput.files.length === 0 && isEditing) {
      const currentPicture = pictureElem.src.split('/').pop();
      formData.set('picture', currentPicture);
    }

    const requestOptions = {
      method: isEditing ? 'PUT' : 'POST',
      body: formData,
    };

    try {
      const response = await fetch(`/recipes/${isEditing ? currentRecipeId : ''}`, requestOptions);

      if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }

      window.location.reload();
    } catch (error) {
      errorElem.textContent = error.message;
      console.error('Error:', error); 
    }
  }

  addRecipeButton.addEventListener('click', () => {
    isEditing = false;
    currentRecipeId = null;
    document.getElementById('form-title').textContent = 'Add a New Recipe';
    recipeForm.reset();
    recipeFormContainer.classList.remove('hidden');

    recipeFormContainer.scrollIntoView({ behavior: 'smooth' });

    deleteButton.classList.add('hidden');
    editButton.classList.add('hidden');
  });

  cancelButton.addEventListener('click', () => {
    recipeFormContainer.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateButtonVisibility();
  });

  recipeForm.addEventListener('submit', submitRecipe);

  const recipes = await loadJson('/recipes');
  if (recipes) {
    recipes.forEach(recipe => {
      const option = document.createElement('option');
      option.value = recipe.id;
      option.textContent = recipe.name;
      recipeSelect.appendChild(option);
    });

    recipeSelect.addEventListener('change', selectRecipe);
  }

  // Gotta work on this guy
  updateButtonVisibility();
});
