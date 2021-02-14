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
      messageContainer.scrollTop = messageContainer.scrollHeight;
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
      state.isGameOn = true;
    });

    socket.on("gameMove", (message) => {
      oponentMakeMove(message);
    });

    socket.on("gameOver", (message) => {
      showModal(message);
    });

    socket.on("disconnectionMessage", (message) => {
      showModal(message);
    });

    let board = document.querySelector("#game-container");

    let state = {
      colorTurn: "white",
      oldTurns: [],
      coordinatesFrom: [],
      coordinatesTo: [],
      cellFrom: "",
      cellTo: "",
      isGameOn: false,
      myColor: "",
    };

    const showModal = (message) => {
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
      if (
        (e.target.classList.contains("piece") ||
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
        if (possiblePieceMove()) {
          makeMove(state.cellFrom, state.cellTo);
          if (isKingInCheck()) {
            revertMove();
          } else {
            commitMove();
          }
        }
      }
    };

    const makeMove = (from, to) => {
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

    const oponentMakeMove = (message) => {
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
      state.cellFrom = "";
      state.cellTo = "";
      state.coordinatesFrom = [];
      state.coordinatesTo = [];
    };

    const revertMove = () => {
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

    const commitMove = () => {
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
      if (!state.isGameOn) {
        socket.emit("gameOver", "You lost by checkmate");
        showModal("You won by checkmate");
      }
      state.coordinatesFrom = [];
      state.coordinatesTo = [];
    };

    const possiblePieceMove = () => {
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
      return false;
    };

    const possiblePawnMoves = (from) => {
      let possibleMoves = [];
      let fromX = +from.id.split(",")[0];
      let fromY = +from.id.split(",")[1];

      if (from.firstChild.dataset.color === "white") {
        let piece = document.getElementById(`${fromX + 1},${fromY + 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "black"
        ) {
          possibleMoves.push(piece.id);
        }

        piece = document.getElementById(`${fromX - 1},${fromY + 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "black"
        ) {
          possibleMoves.push(piece.id);
        }

        piece = document.getElementById(`${fromX},${fromY + 2}`);
        if (piece && !piece.firstChild && fromY === 1) {
          possibleMoves.push(piece.id);
        }

        piece = document.getElementById(`${fromX},${fromY + 1}`);
        if (piece && !piece.firstChild) {
          possibleMoves.push(piece.id);
        }
      } else if (from.firstChild.dataset.color === "black") {
        let piece = document.getElementById(`${fromX + 1},${fromY - 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "white"
        ) {
          possibleMoves.push(piece.id);
        }

        piece = document.getElementById(`${fromX - 1},${fromY - 1}`);
        if (
          piece &&
          piece.firstChild &&
          piece.firstChild.dataset.color === "white"
        ) {
          possibleMoves.push(piece.id);
        }

        piece = document.getElementById(`${fromX},${fromY - 2}`);
        if (piece && !piece.firstChild && fromY === 6) {
          possibleMoves.push(piece.id);
        }

        piece = document.getElementById(`${fromX},${fromY - 1}`);
        if (piece && !piece.firstChild) {
          possibleMoves.push(piece.id);
        }
      }
      return possibleMoves;
    };

    const possibleKnightMoves = (from) => {
      let possibleMoves = [];
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
            possibleMoves.push(piece.id);
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
            possibleMoves.push(piece.id);
          }
        }
      }
      return possibleMoves;
    };

    const possibleRookMoves = (from) => {
      let possibleMoves = [];
      let fromX = +from.id.split(",")[0];
      let fromY = +from.id.split(",")[1];

      for (let x = fromX + 1; x < 8; x++) {
        let piece = document.getElementById(`${x},${fromY}`);
        if (!piece.firstChild) {
          possibleMoves.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          possibleMoves.push(piece.id);
          break;
        }
      }

      for (let x = fromX - 1; x >= 0; x--) {
        let piece = document.getElementById(`${x},${fromY}`);
        if (!piece.firstChild) {
          possibleMoves.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          possibleMoves.push(piece.id);
          break;
        }
      }

      for (let y = fromY + 1; y < 8; y++) {
        let piece = document.getElementById(`${fromX},${y}`);
        if (!piece.firstChild) {
          possibleMoves.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          possibleMoves.push(piece.id);
          break;
        }
      }

      for (let y = fromY - 1; y >= 0; y--) {
        let piece = document.getElementById(`${fromX},${y}`);
        if (!piece.firstChild) {
          possibleMoves.push(piece.id);
        } else if (
          from.firstChild.dataset.color === piece.firstChild.dataset.color
        ) {
          break;
        } else if (
          from.firstChild.dataset.color !== piece.firstChild.dataset.color
        ) {
          possibleMoves.push(piece.id);
          break;
        }
      }
      return possibleMoves;
    };

    const possibleBishopMoves = (from) => {
      let possibleMoves = [];
      let fromX = +from.id.split(",")[0];
      let fromY = +from.id.split(",")[1];
      let upY = fromY + 1;
      let downY = fromY - 1;

      for (let x = fromX + 1; x < 8; x++) {
        if (upY < 8) {
          let piece = document.getElementById(`${x},${upY}`);

          if (!piece.firstChild) {
            possibleMoves.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            upY = 9;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            possibleMoves.push(piece.id);
            upY = 9;
          }
          upY++;
        }

        if (downY >= 0) {
          let piece = document.getElementById(`${x},${downY}`);

          if (!piece.firstChild) {
            possibleMoves.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            downY = -1;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            possibleMoves.push(piece.id);
            downY = -1;
          }
          downY--;
        }
      }

      upY = fromY + 1;
      downY = fromY - 1;

      for (let x = fromX - 1; x >= 0; x--) {
        if (upY < 8) {
          let piece = document.getElementById(`${x},${upY}`);

          if (!piece.firstChild) {
            possibleMoves.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            upY = 9;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            possibleMoves.push(piece.id);
            upY = 9;
          }
          upY++;
        }

        if (downY >= 0) {
          let piece = document.getElementById(`${x},${downY}`);
          if (!piece.firstChild) {
            possibleMoves.push(piece.id);
          } else if (
            from.firstChild.dataset.color === piece.firstChild.dataset.color
          ) {
            downY = -1;
          } else if (
            from.firstChild.dataset.color !== piece.firstChild.dataset.color
          ) {
            possibleMoves.push(piece.id);
            downY = -1;
          }
          downY--;
        }
      }
      return possibleMoves;
    };

    const possibleQueenMoves = (from) => {
      let possibleMoves = [];

      for (let path of possibleBishopMoves(from)) {
        possibleMoves.push(path);
      }

      for (let path of possibleRookMoves(from)) {
        possibleMoves.push(path);
      }

      return possibleMoves;
    };

    const possibleKingMoves = (from) => {
      let possibleMoves = [];
      let fromX = +from.id.split(",")[0];
      let fromY = +from.id.split(",")[1];
      let moves = [-1, 0, 1];

      for (let i of moves) {
        for (let j of moves) {
          let piece = document.getElementById(`${fromX + i},${fromY + j}`);
          if (
            piece &&
            (!piece.firstChild ||
              (piece.firstChild &&
                from.firstChild.dataset.color !==
                  piece.firstChild.dataset.color))
          ) {
            possibleMoves.push(piece.id);
          }
        }
      }
      return possibleMoves;
    };

    const isKingInCheck = () => {
      let king = document.querySelector(
        `[data-piece="king"][data-color=${state.colorTurn}]`
      ).parentElement;
      let kingCoordinates = king.id.split(",");
      let check = false;

      document
        .getElementById("game-container")
        .querySelectorAll(
          `img[data-color=${state.colorTurn === "white" ? "black" : "white"}]`
        )
        .forEach((piece) => {
          let type = piece.dataset.piece;
          piece = piece.parentElement;

          if (
            (type === "pawn" &&
              possiblePawnMoves(piece).indexOf(kingCoordinates.toString()) >
                -1) ||
            (type === "knight" &&
              possibleKnightMoves(piece).indexOf(kingCoordinates.toString()) >
                -1) ||
            (type === "rook" &&
              possibleRookMoves(piece).indexOf(kingCoordinates.toString()) >
                -1) ||
            (type === "bishop" &&
              possibleBishopMoves(piece).indexOf(kingCoordinates.toString()) >
                -1) ||
            (type === "queen" &&
              possibleQueenMoves(piece).indexOf(kingCoordinates.toString()) >
                -1) ||
            (type === "king" &&
              possibleKingMoves(piece).indexOf(kingCoordinates.toString()) > -1)
          ) {
            check = true;
          }
        });

      return check;
    };

    const isKingInCheckMate = () => {
      for (let piece of document
        .getElementById("game-container")
        .querySelectorAll(`img[data-color=${state.colorTurn}]`)) {
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
          makeMove(piece, document.getElementById(`${path}`));

          if (!isKingInCheck()) {
            revertMove();
            return false;
          } else {
            revertMove();
          }
        }
      }
      return true;
    };
  }
}
