    const tableBody = document.querySelector('#games-body');
    const form = document.querySelector('#game-form');
    const message = document.querySelector('#message');

    function ShowMessage(text) {
      message.textContent = text;
    }

    function AddGameRow(game) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="/api/games/${game._id}">${game.name}</a></td>
        <td>${game.year}</td>
        <td>$${Number(game.price).toFixed(2)}</td>
        <td>${game.mainCharacter}</td>
      `;
      tableBody.appendChild(row);
    }

    async function LoadGames() {
      tableBody.innerHTML = '';
      const response = await fetch('/api/games');
      const games = await response.json();
      games.forEach(AddGameRow);
      ShowMessage(`Loaded ${games.length} game(s).`);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const game = {
        name: formData.get('name'),
        year: Number(formData.get('year')),
        price: Number(formData.get('price')),
        mainCharacter: formData.get('mainCharacter')
      };
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game)
      });
      if (!response.ok) {
        const error = await response.json();
        ShowMessage(error.error || 'Could not add game.');
        return;
      }
      form.reset();
      await LoadGames();
    });

    LoadGames().catch(error => ShowMessage(error.message));