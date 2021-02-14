import view from "./view.js";
import { navigateTo } from "../router.js";

export default class extends view {
  constructor() {
    super();
    this.setTitle("Game");
  }

  async render() {
    return `<div id="room-container">
                <div id="game-container"></div>
                <div id="chat-container">
                <div id="messages-container"></div>
                <form id="send-container">
                    <input type="text" id="message-input" />
                    <button type="submit" id="send-button">Send</button>
                </form>
                </div>
            </div>
            <div id="modal">
                <div id="modal-content">
                <p id="modal-message"></p>
                <button id="modal-accept">OK</button>
                </div>
            </div>`;
  }

  async afterRender() {
    if (!localStorage.getItem("token")) {
      navigateTo("/");
    }

    const messageForm = document.getElementById("send-container");
    const messageInput = document.getElementById("message-input");
    const messageContainer = document.getElementById("messages-container");
    const socket = io();

    const appendMessage = (message) => {
      const messageElement = document.createElement("div");
      messageElement.innerText = message;
      messageContainer.append(messageElement);
    };

    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      socket.emit("chatMessage", messageInput.value);
      messageInput.value = "";
    });

    socket.emit("joinGame", {
      auth_token: localStorage.getItem("token"),
      room: location.pathname,
    });

    socket.on("chatMessage", (message) => {
      appendMessage(message);
    });

    socket.on("connectionMessage", (message) => {
      appendMessage(message);
    });

    socket.on("turnMessage", (message) => {
      if (message) {
        state.myColor = "white";
      } else {
        state.myColor = "black";

        board.classList.add("black");
      }
    });

    socket.on("gameMove", (message) => {
      oponentTakeTurn(message);
    });

    socket.on("disconnectionMessage", (message) => {
      const modal = document.getElementById("modal");
      const modalMessage = document.getElementById("modal-message");
      const modalAccept = document.getElementById("modal-accept");

      socket.close();
      modalMessage.innerHTML = message;
      modal.style.display = "flex";

      modalAccept.addEventListener("click", () => {
        modal.style.display = "none";
        navigateTo("/dashboard");
      });
    });

    let board = document.querySelector("#game-container");

    let state = {
      colorTurn: "white",
      oldTurns: [],
      coordinatesFrom: [],
      coordinatesTo: [],
      cellFrom: "",
      cellTo: "",
      isGameOn: true,
      myColor: "white",
    };

    const createBoard = () => {
      for (let i = 7; i >= 0; i--) {
        for (let j = 0; j < 8; j++) {
          let cell = document.createElement("div");
          cell.id = `${j},${i}`;

          if (j == 0) {
            cell.classList.add("cell", "row");
          } else {
            cell.classList.add("cell");
          }

          if (i % 2 == 0) {
            if (j % 2 == 0) {
              cell.style.backgroundColor = "#946f51";
            } else {
              cell.style.backgroundColor = "#F0D9B5";
            }
          } else {
            if (j % 2 == 0) {
              cell.style.backgroundColor = "#F0D9B5";
            } else {
              cell.style.backgroundColor = "#946f51";
            }
          }

          createPiece(cell);
          board.appendChild(cell);
        }
      }
    };

    const createPiece = (cell) => {
      let i = cell.id.split(",")[1];
      let j = cell.id.split(",")[0];
      let piece = "";

      if (i == 1 || i == 6) {
        piece = "pawn";
      } else if ((i == 0 || i == 7) && (j == 0 || j == 7)) {
        piece = "rook";
      } else if ((i == 0 || i == 7) && (j == 1 || j == 6)) {
        piece = "knight";
      } else if ((i == 0 || i == 7) && (j == 2 || j == 5)) {
        piece = "bishop";
      } else if ((i == 0 || i == 7) && j == 3) {
        piece = "queen";
      } else if ((i == 0 || i == 7) && j == 4) {
        piece = "king";
      } else {
        return;
      }

      let img = document.createElement("img");
      img.setAttribute("data-piece", piece);
      img.classList.add("piece");
      if (i == 0 || i == 1) {
        img.src = `../static/icons/white/${piece}.png`;
        img.setAttribute("data-color", "white");
      } else {
        img.src = `../static/icons/black/${piece}.png`;
        img.setAttribute("data-color", "black");
      }

      cell.appendChild(img);
    };

    createBoard();

    board.addEventListener("click", (e) => {
      console.log(state);

      if (
        ((e.target.classList.contains("piece") &&
          e.target.dataset.color === state.myColor) ||
          e.target.classList.contains("cell")) &&
        state.isGameOn &&
        state.myColor === state.colorTurn
      ) {
        nextMove(e);
      }
    });

    const nextMove = (e) => {
      state.cellTo =
        e.target.className === "piece" ? e.target.parentElement : e.target;
      state.coordinatesTo = state.cellTo.id.split(",");

      if (
        state.coordinatesFrom.length === 0 &&
        state.cellTo.firstChild &&
        state.cellTo.firstChild.dataset.color === state.colorTurn
      ) {
        state.coordinatesFrom = state.coordinatesTo;
        state.cellFrom = state.cellTo;
        state.cellFrom.classList.add("selected");
      } else if (
        state.coordinatesFrom.toString() === state.coordinatesTo.toString()
      ) {
        if (state.cellFrom.classList) {
          state.cellFrom.classList.remove("selected");
        }
        state.cellFrom = "";
        state.cellTo = "";
        state.coordinatesFrom = [];
        state.coordinatesTo = [];
      } else if (
        state.coordinatesFrom.length === 2 &&
        ((state.cellTo.firstChild &&
          state.cellTo.firstChild.dataset.color !== state.colorTurn) ||
          !state.cellTo.firstChild)
      ) {
        if (viableMove()) {
          takeTurn(state.cellFrom, state.cellTo);
          if (isKingInCheck()) {
            revertTurn();
          } else {
            endTurn();
          }
        }
      }
    };

    const takeTurn = (from, to) => {
      let turn = {};
      if (to.firstChild) {
        turn.removedPiece = to.removeChild(to.firstChild);
      }
      let piece = from.removeChild(from.firstChild);
      to.appendChild(piece);

      turn.piece = piece;
      turn.from = from;
      turn.to = to;

      state.oldTurns.push(turn);
    };

    const oponentTakeTurn = (message) => {
      let from = document.getElementById(
        `${message.lastMoveFrom[0]},${message.lastMoveFrom[1]}`
      );
      let piece = from.firstChild;
      let to = document.getElementById(
        `${message.lastMoveTo[0]},${message.lastMoveTo[1]}`
      );

      let turn = {};
      if (to.firstChild) {
        turn.removedPiece = to.removeChild(to.firstChild);
      }
      piece = from.removeChild(from.firstChild);
      to.appendChild(piece);

      turn.piece = piece;
      turn.from = from;
      turn.to = to;

      state.oldTurns.push(turn);
      state.colorTurn = state.colorTurn === "white" ? "black" : "white";
    };

    const revertTurn = () => {
      if (state.oldTurns.length === 0) {
        return state.oldTurns;
      }

      let turn = state.oldTurns.pop();

      if ("removedPiece" in turn) {
        turn.to.appendChild(turn.removedPiece);
      }

      turn.to.removeChild(turn.piece);
      turn.from.appendChild(turn.piece);
    };

    const endTurn = () => {
      if (state.cellFrom.classList) {
        state.cellFrom.classList.remove("selected");
      }

      state.cellFrom = "";
      state.cellTo = "";

      switchTurn();
    };

    const switchTurn = () => {
      state.colorTurn = state.colorTurn === "white" ? "black" : "white";
      if (isKingInCheck()) {
      }
      if (isKingInCheckMate()) {
        state.isGameOn = false;
      }

      let lastMoveFrom = state.coordinatesFrom;
      let lastMoveTo = state.coordinatesTo;

      socket.emit("gameMove", { lastMoveFrom, lastMoveTo });

      state.coordinatesFrom = [];
      state.coordinatesTo = [];
    };

    const viableMove = () => {
      let piece = state.cellFrom.firstChild.dataset.piece;

      if (
        piece === "pawn" &&
        possiblePawnMoves(state.cellFrom, state.cellTo).indexOf(
          state.coordinatesTo.toString()
        ) > -1
      ) {
        return true;
      } else if (
        piece === "knight" &&
        possibleKnightMoves(state.cellFrom, state.cellTo).indexOf(
          state.coordinatesTo.toString()
        ) > -1
      ) {
        return true;
      } else if (
        piece === "rook" &&
        possibleRookMoves(state.cellFrom).indexOf(
          state.coordinatesTo.toString()
        ) > -1
      ) {
        return true;
      } else if (
        piece === "bishop" &&
        possibleBishopMoves(state.cellFrom).indexOf(
          state.coordinatesTo.toString()
        ) > -1
      ) {
        return true;
      } else if (
        piece === "queen" &&
        possibleQueenMoves(state.cellFrom).indexOf(
          state.coordinatesTo.toString()
        ) > -1
      ) {
        return true;
      } else if (
        piece === "king" &&
        possibleKingMoves(state.cellFrom, state.cellTo).indexOf(
          state.coordinatesTo.toString()
        ) > -1
      ) {
        return true;
      }
    };

    const possiblePawnMoves = (from) => {
      let options = [];

      let from_x = +from.id.split(",")[0];
      let from_y = +from.id.split(",")[1];

      if (from.firstChild.dataset.color === "white") {
        let piece = document.getElementById(`${from_x + 1},${from_y + 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "black"
        ) {
          options.push(piece.id);
        }

        piece = document.getElementById(`${from_x - 1},${from_y + 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "black"
        ) {
          options.push(piece.id);
        }

        piece = document.getElementById(`${from_x},${from_y + 2}`);
        if (piece && !piece.firstChild && from_y === 1) {
          options.push(piece.id);
        }

        piece = document.getElementById(`${from_x},${from_y + 1}`);
        if (piece && !piece.firstChild) {
          options.push(piece.id);
        }
      } else if (from.firstChild.dataset.color === "black") {
        let piece = document.getElementById(`${from_x + 1},${from_y - 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "white"
        ) {
          options.push(piece.id);
        }

        piece = document.getElementById(`${from_x - 1},${from_y - 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "white"
        ) {
          options.push(piece.id);
        }

        piece = document.getElementById(`${from_x},${from_y - 2}`);
        if (piece && !piece.firstChild && from_y === 6) {
          options.push(piece.id);
        }

        piece = document.getElementById(`${from_x},${from_y - 1}`);
        if (piece && !piece.firstChild) {
          options.push(piece.id);
        }
      }
      return options;
    };

    const possibleKnightMoves = (from) => {
      let options = [];

      let x = +from.id.split(",")[0];
      let y = +from.id.split(",")[1];
      let twos = [2, -2];
      let ones = [1, -1];

      for (let i of twos) {
        for (let j of ones) {
          i = +i;
          j = +j;

          let piece = document.getElementById(`${x + i},${y + j}`);
          if (
            piece &&
            (!piece.firstChild ||
              (piece.firstChild &&
                piece.firstChild.dataset.color !== state.colorTurn))
          ) {
            options.push(piece.id);
          }
        }
      }

      for (let i of ones) {
        for (let j of twos) {
          i = +i;
          j = +j;

          let piece = document.getElementById(`${x + i},${y + j}`);
          if (
            piece &&
            (!piece.firstChild ||
              piece.firstChild.dataset.color !== state.colorTurn)
          ) {
            options.push(piece.id);
          }
        }
      }
      return options;
    };

    const possibleRookMoves = (from) => {
      let options = [];
      let from_x = +from.id.split(",")[0];
      let from_y = +from.id.split(",")[1];

      for (let x = from_x + 1; x < 8; x++) {
        let piece = document.getElementById(`${x},${from_y}`);
        if (!piece.firstChild) {
          options.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          options.push(piece.id);
          break;
        }
      }

      for (let x = from_x - 1; x >= 0; x--) {
        let piece = document.getElementById(`${x},${from_y}`);
        if (!piece.firstChild) {
          options.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          options.push(piece.id);
          break;
        }
      }

      for (let y = from_y + 1; y < 8; y++) {
        let piece = document.getElementById(`${from_x},${y}`);
        if (!piece.firstChild) {
          options.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          options.push(piece.id);
          break;
        }
      }

      for (let y = from_y - 1; y >= 0; y--) {
        let piece = document.getElementById(`${from_x},${y}`);
        if (!piece.firstChild) {
          options.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          options.push(piece.id);
          break;
        }
      }
      return options;
    };

    const possibleBishopMoves = (from) => {
      let options = [];
      let from_x = +from.id.split(",")[0];
      let from_y = +from.id.split(",")[1];

      let y_up = from_y + 1;
      let y_down = from_y - 1;
      for (let x = from_x + 1; x < 8; x++) {
        if (y_up < 8) {
          let piece = document.getElementById(`${x},${y_up}`);

          if (!piece.firstChild) {
            options.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            y_up = 9;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            options.push(piece.id);
            y_up = 9;
          }
          y_up++;
        }

        if (y_down >= 0) {
          let piece = document.getElementById(`${x},${y_down}`);

          if (!piece.firstChild) {
            options.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            y_down = -1;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            options.push(piece.id);
            y_down = -1;
          }
          y_down--;
        }
      }

      y_up = from_y + 1;
      y_down = from_y - 1;

      for (let x = from_x - 1; x >= 0; x--) {
        if (y_up < 8) {
          let piece = document.getElementById(`${x},${y_up}`);

          if (!piece.firstChild) {
            options.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            y_up = 9;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            options.push(piece.id);
            y_up = 9;
          }
          y_up++;
        }

        if (y_down >= 0) {
          let piece = document.getElementById(`${x},${y_down}`);
          if (!piece.firstChild) {
            options.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            y_down = -1;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            options.push(piece.id);
            y_down = -1;
          }
          y_down--;
        }
      }
      return options;
    };

    const possibleQueenMoves = (from) => {
      let options = [];

      let diagonals = possibleBishopMoves(from);
      let straights = possibleRookMoves(from);

      for (let path of diagonals) {
        options.push(path);
      }

      for (let path of straights) {
        options.push(path);
      }

      return options;
    };

    const possibleKingMoves = (from) => {
      let options = [];
      let from_x = +from.id.split(",")[0];
      let from_y = +from.id.split(",")[1];

      let moves = [-1, 0, 1];
      for (let i of moves) {
        for (let j of moves) {
          let piece = document.getElementById(`${from_x + i},${from_y + j}`);
          if (
            piece &&
            (!piece.firstChild ||
              (piece.firstChild &&
                from.firstChild.dataset.color !==
                  piece.firstChild.dataset.color))
          ) {
            options.push(piece.id);
          }
        }
      }
      return options;
    };

    const isKingInCheck = () => {
      let king = document.querySelector(
        `[data-piece="king"][data-color=${state.colorTurn}]`
      ).parentElement;
      let king_coords = king.id.split(",");

      let opponent_color = state.colorTurn === "white" ? "black" : "white";
      let opponent_pieces = document
        .getElementById("game-container")
        .querySelectorAll(`img[data-color=${opponent_color}]`);

      let check = false;

      opponent_pieces.forEach((piece) => {
        let type = piece.dataset.piece;
        piece = piece.parentElement;
        if (
          type === "pawn" &&
          possiblePawnMoves(piece).indexOf(king_coords.toString()) > -1
        ) {
          check = true;
        } else if (
          type === "knight" &&
          possibleKnightMoves(piece).indexOf(king_coords.toString()) > -1
        ) {
          check = true;
        } else if (
          type === "rook" &&
          possibleRookMoves(piece).indexOf(king_coords.toString()) > -1
        ) {
          check = true;
        } else if (
          type === "bishop" &&
          possibleBishopMoves(piece).indexOf(king_coords.toString()) > -1
        ) {
          check = true;
        } else if (
          type === "queen" &&
          possibleQueenMoves(piece).indexOf(king_coords.toString()) > -1
        ) {
          check = true;
        } else if (
          type === "king" &&
          possibleKingMoves(piece).indexOf(king_coords.toString()) > -1
        ) {
          check = true;
        }
      });

      return check;
    };

    const isKingInCheckMate = () => {
      let pieces = document
        .getElementById("game-container")
        .querySelectorAll(`img[data-color=${state.colorTurn}]`);
      for (let piece of pieces) {
        let paths = [];
        let type = piece.dataset.piece;
        piece = piece.parentElement;

        if (type === "pawn") {
          paths = possiblePawnMoves(piece);
        } else if (type === "knight") {
          paths = possibleKnightMoves(piece);
        } else if (type === "rook") {
          paths = possibleRookMoves(piece);
        } else if (type === "bishop") {
          paths = possibleBishopMoves(piece);
        } else if (type === "queen") {
          paths = possibleQueenMoves(piece);
        } else if (type === "king") {
          paths = possibleKingMoves(piece);
        }

        for (let path of paths) {
          let to_path = document.getElementById(`${path}`);
          takeTurn(piece, to_path);

          if (!isKingInCheck()) {
            revertTurn();
            return false;
          } else {
            revertTurn();
          }
        }
      }
      return true;
    };
  }
}
