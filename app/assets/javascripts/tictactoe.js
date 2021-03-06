
var currentGame = 0
var prevSaved = 0
var turn = 0
var WINNING_COMBOS =
      [
        [0,1,2], // top row
        [3,4,5], // middle row
        [6,7,8], // bottom row
        [0,3,6], // left column
        [1,4,7], // middle column
        [2,5,8], // right column
        [0,4,8], // left diagonal
        [2,4,6]  // right diagonal
      ]

function attachListeners() {

		document.querySelectorAll('td')
		.forEach(e => e.addEventListener('click', tdClickHandler))

		document.querySelector('#games').addEventListener('click', liClickHandler)

		document.getElementById('save').addEventListener('click', saveGame)

		document.getElementById('previous').addEventListener('click', previousGame)

		document.getElementById('clear').addEventListener('click', clearGame)
}

window.onload =	attachListeners

function tdClickHandler() {
    // 'this' refers to the element the event was hooked on  
    square = this
    doTurn(square)    
}

function liClickHandler(e) {
    // 'e' refers to the element the event was hooked on
    gameId = e.target.textContent
    // get the game whose button has been clicked
    getGame(gameId)
}

function player() {
	// Return 'X' when the turn variable is even and 'O' when it is odd
	if (turn % 2 == 0) {
		return 'X'
	} else {
		return 'O'
	}  
}

function updateState(square) {
	// add the current player's token to the passed-in <td> element
	currentPlayer = player()
	
	if (square.textContent == '') {
		// Users can only place a token in a square that is not already taken
		$(square).text(currentPlayer)
	} else turn -= 1	
}

function setMessage(msg) {
	// set a provided string as the innerHTML of the div#message element
	$('#message').text(msg)	  
}

function checkWinner() {
	// check if current player has won (horizontally, vertically, or diagonally)
	// if won, invoke the setMessage() function with the argument 'Player X Won!' or 'Player O Won!'
	board = document.querySelectorAll('td')
	winner = false

	WINNING_COMBOS.some(function(combo) {
	    if (board[combo[0]].textContent !== "" && 
	    	board[combo[0]].textContent === board[combo[1]].textContent && 
	    	board[combo[1]].textContent === board[combo[2]].textContent) {
	      setMessage(`Player ${board[combo[0]].textContent} Won!`);
	      return winner = true;
	    }
	});

	return winner			
	
}

function doTurn(square) {
	// update the play state, check for a winner or a tied game
	updateState(square)
	turn += 1

	if (checkWinner()) {
		// reset the board and the "turn" counter when a game is won
		saveGame()
		clearBoard()
	} else if (turn === 9) {
		// tied game
			setMessage('Tie game.')
			saveGame()
			clearBoard()
		} 
}

function getGame (gameId) {
	// get a saved game's state
	$.get('/games/' + gameId, function(data) {
		currentGame = data['data'].id
		retrievedGame = data['data'].attributes.state
		// populate the board with the game just retrieved
		populateBoard(retrievedGame)
	})
	
}

function saveGame() {

	// collect the board data to create or update a game in the database
	gameState = []
	newGame = {}
	url = '/games/'+ currentGame;
	boardState = Array.from(document.querySelectorAll('td'))
	for (let i = 0; i < 9; i++) {
	    	gameState.push(boardState[i].textContent)
	  	}
	newGame['state'] = gameState
	jsonString = JSON.stringify(newGame)

	if (currentGame) {
		// update an existing game
        $.ajax({
            type : 'PATCH',
            url : url,
            contentType: 'application/json',
            data : jsonString,
            error: function(xhr, status, error){
              alert(error)
            }
        })
	} else {
		// create a new game
		posting = $.post('/games', newGame)
		posting.done(function(data) {
			currentGame = data['data'].id
		})
	}
}

function previousGame() {
	// get games stored in the database
	newSaved = 0
	$.get('/games', function(data) {
		savedGamesArr = data['data']
		if (savedGamesArr.length > 0 && savedGamesArr.length > prevSaved) {
			// add game/s not already displayed to the displayed list with last-updated local time
			newSaved = (savedGamesArr.length - prevSaved)
			
			for (let i = newSaved; i <= newSaved && i >= 1; i--) {
				  prevId = savedGamesArr[savedGamesArr.length-i].id
				  updatedAt = data['data'][savedGamesArr.length-i].attributes['updated-at']
				  date = new Date(updatedAt)
				  time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
		    	  $('#games').append(`<button><li>${prevId}</li></button> ${time}<br>`)
		    	}

		    prevSaved += newSaved
		}
		
    })
}

function populateBoard(retrievedGame) {
	// populate the board wth the retrieved game and update 'turn' count for the next player's go
	board = document.querySelectorAll('td')
	gameTurns = 0

  	for (let i = 0; i < 9; i++) {
    	board[i].innerHTML = retrievedGame[i]
    	if (retrievedGame[i] != '') {
    		gameTurns += 1
    	}
  	}

  	turn = gameTurns
}

function clearBoard() {

	$('td').empty()
	currentGame = 0
	turn = 0
}

function clearGame() {

	$('td').empty()
	currentGame = 0
	turn = 0
	setMessage('')
}
