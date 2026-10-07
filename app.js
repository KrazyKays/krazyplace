const setupScreen = document.querySelector("#setup-screen");
const gameScreen = document.querySelector("#game-screen");
const setupForm = document.querySelector("#setup-form");
const modeSelect = document.querySelector("#game-mode");
const playerList = document.querySelector("#player-list");
const playerCount = document.querySelector("#player-count");
const segmentSelect = document.querySelector("#segment-select");
const multiplierSelect = document.querySelector("#multiplier-select");
const history = [];

let game = null;
let nextPlayerId = 1;

function addPlayerField(name = "") {
  if (playerList.children.length >= 8) return;

  const row = document.createElement("div");
  row.className = "player-row";

  const input = document.createElement("input");
  input.className = "player-input";
  input.type = "text";
  input.maxLength = 24;
  input.autocomplete = "off";
  input.placeholder = `Joueur ${playerList.children.length + 1}`;
  input.setAttribute("aria-label", `Nom du joueur ${playerList.children.length + 1}`);
  input.value = name;

  const remove = document.createElement("button");
  remove.className = "remove-player";
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Retirer ce joueur");
  remove.addEventListener("click", () => {
    if (playerList.children.length <= 2) return;
    row.remove();
    updatePlayerFields();
  });

  row.append(input, remove);
  playerList.append(row);
  updatePlayerFields();
}

function updatePlayerFields() {
  const rows = [...playerList.querySelectorAll(".player-row")];
  playerCount.textContent = `${rows.length} joueur${rows.length > 1 ? "s" : ""}`;
  rows.forEach((row, index) => {
    const input = row.querySelector("input");
    input.placeholder = `Joueur ${index + 1}`;
    input.setAttribute("aria-label", `Nom du joueur ${index + 1}`);
    row.querySelector("button").disabled = rows.length <= 2;
  });
}

function updateModeOptions() {
  const isCricket = modeSelect.value === "cricket";
  document.querySelector("#x01-options").hidden = isCricket;
  document.querySelector("#visit-summary").hidden = isCricket;
  fillSegmentOptions(isCricket);
}

function fillSegmentOptions(isCricket) {
  segmentSelect.replaceChildren();
  const options = isCricket
    ? [["miss", "Raté"], ...[20, 19, 18, 17, 16, 15].map((n) => [String(n), String(n)]), ["25", "Bull extérieur"], ["50", "Bull intérieur"]]
    : [["0", "Raté (0)"], ...Array.from({ length: 20 }, (_, i) => [String(i + 1), `Secteur ${i + 1}`]), ["25", "Bull extérieur (25)"], ["50", "Bull intérieur (50)"]];

  for (const [value, label] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    segmentSelect.append(option);
  }
  updateMultiplier();
}

function updateMultiplier() {
  const isCricket = (game?.mode ?? modeSelect.value) === "cricket";
  const isBull = Number(segmentSelect.value) >= 25;
  document.querySelector("#multiplier-field").hidden = isCricket && isBull;
  multiplierSelect.disabled = isBull || Boolean(game?.winner);
  if (isBull) multiplierSelect.value = "1";
}

function createGame(mode, names, rules) {
  const isCricket = mode === "cricket";
  const score = isCricket ? 0 : Number(mode);
  return {
    mode,
    players: names.map((name) => ({
      id: nextPlayerId++,
      name,
      score,
      opened: !rules.doubleIn,
      marks: Object.fromEntries([20, 19, 18, 17, 16, 15, 25].map((target) => [target, 0])),
    })),
    currentPlayer: 0,
    dartsInVisit: 0,
    visitStartScore: null,
    visitStartOpen: null,
    visitScore: 0,
    round: 1,
    winner: null,
    doubleIn: !isCricket && rules.doubleIn,
    doubleOut: !isCricket && rules.doubleOut,
    log: [],
    message: "",
    messageType: "",
  };
}

function cloneGame(value) {
  return JSON.parse(JSON.stringify(value));
}

function remember() {
  history.push(cloneGame(game));
}

function addLog(text, score) {
  game.log.unshift({ text, score });
  game.log.length = Math.min(game.log.length, 6);
}

function activePlayer() {
  return game.players[game.currentPlayer];
}

function endVisit(message = "", messageType = "") {
  game.dartsInVisit = 0;
  game.visitStartScore = null;
  game.visitStartOpen = null;
  game.visitScore = 0;
  if (!game.winner) {
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    if (game.currentPlayer === 0) game.round += 1;
  }
  game.message = message;
  game.messageType = messageType;
}

function registerX01Dart() {
  const player = activePlayer();
  const segment = Number(segmentSelect.value);
  const multiplier = Number(multiplierSelect.value);
  const points = segment >= 25 ? segment : segment * multiplier;
  const isDouble = multiplier === 2 || segment === 50;
  const wasOpen = player.opened;
  const wasScore = player.score;
  const dartName = segment === 0
    ? "Raté"
    : segment === 25 || segment === 50
      ? (segment === 50 ? "Bull intérieur" : "Bull extérieur")
      : `${multiplier === 1 ? "Simple" : multiplier === 2 ? "Double" : "Triple"} ${segment}`;

  if (game.dartsInVisit === 0) {
    game.visitStartScore = player.score;
    game.visitStartOpen = player.opened;
  }
  game.dartsInVisit += 1;

  if (!player.opened && isDouble) player.opened = true;
  if (player.opened) player.score -= points;
  else game.message = "Double in : il faut toucher un double pour commencer.";

  game.visitScore += wasOpen || player.opened ? points : 0;
  const isBust = player.score < 0 || (game.doubleOut && player.score === 0 && !isDouble);

  if (isBust) {
    player.score = game.visitStartScore;
    player.opened = game.visitStartOpen;
    addLog(`${player.name} — bust`, 0);
    endVisit("Bust ! Le score de la volée est annulé.", "warning");
    return;
  }

  if (player.score === 0) {
    game.winner = player.id;
    addLog(`${player.name} termine (${dartName})`, wasScore);
    game.message = "Partie gagnée !";
    game.messageType = "";
    return;
  }

  if (game.dartsInVisit === 3) {
    const visitScore = game.visitStartScore - player.score;
    addLog(`${player.name} — ${dartName} et volée terminée`, visitScore);
    endVisit();
    return;
  }

  game.message = `${dartName} : ${points} point${points > 1 ? "s" : ""}.`;
  game.messageType = "";
}

function cricketTargetScore(target) {
  return target === 25 ? 25 : target;
}

function registerCricketDart() {
  const player = activePlayer();
  const value = segmentSelect.value;
  const target = value === "miss" ? null : Number(value) === 50 ? 25 : Number(value);
  const multiplier = Number(multiplierSelect.value);
  const marks = value === "miss" ? 0 : Number(value) === 50 ? 2 : Number(value) === 25 ? 1 : multiplier;
  const name = value === "miss"
    ? "Raté"
    : value === "50"
      ? "Bull intérieur"
      : value === "25"
        ? "Bull extérieur"
        : `${multiplier === 1 ? "Simple" : multiplier === 2 ? "Double" : "Triple"} ${value}`;
  game.dartsInVisit += 1;

  let points = 0;
  if (target !== null) {
    const before = player.marks[target];
    const opponentsOpen = game.players.some((other) => other.id !== player.id && other.marks[target] < 3);
    const surplusMarks = Math.max(0, before + marks - 3);
    player.marks[target] = Math.min(3, before + marks);
    if (opponentsOpen) points = surplusMarks * cricketTargetScore(target);
    player.score += points;
    game.visitScore += points;
  }

  const closedAll = Object.values(player.marks).every((count) => count >= 3);
  const bestOpponentScore = Math.max(...game.players.filter((other) => other.id !== player.id).map((other) => other.score));
  if (closedAll && player.score >= bestOpponentScore) {
    game.winner = player.id;
    addLog(`${player.name} — ${name}`, game.visitScore);
    game.message = "Partie gagnée ! Tous les secteurs sont fermés.";
    game.messageType = "";
    return;
  }

  if (game.dartsInVisit === 3) {
    addLog(`${player.name} — volée de 3 fléchettes`, game.visitScore);
    endVisit();
    return;
  }

  game.message = points
    ? `${name} : +${points} points.`
    : target === null
      ? "Raté. Pas de point."
      : `${name} : ${marks} marque${marks > 1 ? "s" : ""}.`;
  game.messageType = "";
}

function throwDart() {
  if (!game || game.winner) return;
  remember();
  if (game.mode === "cricket") registerCricketDart();
  else registerX01Dart();
  renderGame();
}

function finishVisit() {
  if (!game || game.winner || game.dartsInVisit === 0) return;
  remember();
  const player = activePlayer();
  const points = game.mode === "cricket" ? game.visitScore : game.visitStartScore - player.score;
  addLog(`${player.name} — volée terminée`, points);
  endVisit("Volée terminée.");
  renderGame();
}

function renderScoreboard() {
  const scoreboard = document.querySelector("#scoreboard");
  const cricketBoard = document.querySelector("#cricket-board");
  scoreboard.replaceChildren();
  cricketBoard.replaceChildren();
  scoreboard.hidden = game.mode === "cricket";
  cricketBoard.hidden = game.mode !== "cricket";
  document.querySelector("#score-heading").textContent = game.mode === "cricket" ? "Cricket" : "Scores";

  if (game.mode === "cricket") {
    const table = document.createElement("table");
    table.className = "cricket-table";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const label of ["Cible", ...game.players.map((player) => player.name)]) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      headRow.append(cell);
    }
    head.append(headRow);
    const body = document.createElement("tbody");
    for (const target of [20, 19, 18, 17, 16, 15, 25]) {
      const row = document.createElement("tr");
      const title = document.createElement("td");
      title.className = "target-cell";
      title.textContent = target === 25 ? "BULL" : String(target);
      row.append(title);
      for (const player of game.players) {
        const cell = document.createElement("td");
        const marks = player.marks[target];
        cell.className = marks >= 3 ? "mark-closed" : "mark-open";
        cell.textContent = marks >= 3 ? "×" : "•".repeat(marks) || "—";
        cell.setAttribute("aria-label", `${player.name} : ${marks} marque${marks > 1 ? "s" : ""}`);
        row.append(cell);
      }
      body.append(row);
    }
    table.append(head, body);
    cricketBoard.append(table);
    const scores = document.createElement("p");
    scores.className = "cricket-scores";
    scores.textContent = game.players.map((player) => `${player.name} : ${player.score}`).join("   ·   ");
    cricketBoard.append(scores);
    return;
  }

  const cards = document.createElement("div");
  cards.className = "player-scores";
  for (let index = 0; index < game.players.length; index += 1) {
    const player = game.players[index];
    const card = document.createElement("div");
    card.className = `player-score-card${index === game.currentPlayer && !game.winner ? " active" : ""}`;
    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "score-player-name";
    if (index === game.currentPlayer && !game.winner) {
      const dot = document.createElement("span");
      dot.className = "online-dot";
      name.append(dot);
    }
    const label = document.createElement("span");
    label.textContent = player.name;
    name.append(label);
    const subtitle = document.createElement("div");
    subtitle.className = "score-sub";
    subtitle.textContent = player.opened ? "En jeu" : "En attente du double";
    details.append(name, subtitle);
    const score = document.createElement("strong");
    score.className = "score-value";
    score.textContent = String(player.score);
    card.append(details, score);
    cards.append(card);
  }
  scoreboard.append(cards);
}

function createResultImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de créer l’image du résultat.");

  const winner = game.players.find((player) => player.id === game.winner);
  const isCricket = game.mode === "cricket";
  const modeLabel = isCricket ? "CRICKET" : `${game.mode} · ${[
    game.doubleIn ? "DOUBLE IN" : "",
    game.doubleOut ? "DOUBLE OUT" : "",
  ].filter(Boolean).join(" · ") || "CLASSIQUE"}`;
  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#0b1018");
  gradient.addColorStop(1, "#14283a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#55d6ff";
  context.beginPath();
  context.arc(1080, 95, 190, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.12;
  context.fillStyle = "#0b1018";
  context.beginPath();
  context.arc(1080, 95, 142, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = "#55d6ff";
  context.font = "800 24px Segoe UI, sans-serif";
  context.textAlign = "left";
  context.fillText("KDA  /  KRAZY DART APP", 72, 78);

  context.textAlign = "center";
  context.fillStyle = "#95a9bb";
  context.font = "500 18px Segoe UI, sans-serif";
  context.fillText(modeLabel, 600, 151);
  context.fillStyle = "#eff7ff";
  context.font = "800 54px Segoe UI, sans-serif";
  context.fillText(winner.name, 600, 225, 1000);
  context.fillStyle = "#55d6ff";
  context.font = "700 25px Segoe UI, sans-serif";
  context.fillText("REMPORTE LA PARTIE", 600, 270);

  const columns = game.players.length > 4 ? 2 : 1;
  const rowsPerColumn = Math.ceil(game.players.length / columns);
  const rowHeight = Math.min(48, 192 / rowsPerColumn);
  const gridTop = 326;
  const columnWidth = columns === 1 ? 680 : 460;
  const gridLeft = (1200 - columns * columnWidth - (columns - 1) * 24) / 2;

  game.players.forEach((player, index) => {
    const column = Math.floor(index / rowsPerColumn);
    const row = index % rowsPerColumn;
    const x = gridLeft + column * (columnWidth + 24);
    const y = gridTop + row * (rowHeight + 10);
    const isWinner = player.id === game.winner;
    context.fillStyle = isWinner ? "rgba(85, 214, 255, 0.14)" : "rgba(255, 255, 255, 0.06)";
    context.beginPath();
    context.roundRect(x, y, columnWidth, rowHeight, 10);
    context.fill();
    context.textAlign = "left";
    context.fillStyle = isWinner ? "#55d6ff" : "#eff7ff";
    context.font = "600 18px Segoe UI, sans-serif";
    context.fillText(player.name, x + 18, y + rowHeight / 2 + 6, columnWidth - 115);
    context.textAlign = "right";
    context.fillStyle = "#eff7ff";
    context.font = "700 21px Segoe UI, sans-serif";
    context.fillText(String(player.score), x + columnWidth - 18, y + rowHeight / 2 + 7);
  });

  context.textAlign = "center";
  context.fillStyle = "#71869a";
  context.font = "500 14px Segoe UI, sans-serif";
  context.fillText("KRAZY DART APP  ·  BON JEU !", 600, 594);
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Le navigateur n’a pas pu générer l’image."));
    }, "image/png");
  });
}

async function shareResult() {
  const button = document.querySelector("#share-button");
  const message = document.querySelector("#game-message");
  button.disabled = true;
  message.classList.remove("warning");
  message.textContent = "Préparation de l’image…";

  try {
    const canvas = createResultImage();
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "krazy-dart-app-resultat.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ title: "Résultat — Krazy Dart App", files: [file] });
      message.textContent = "Image partagée. Bien joué !";
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      message.textContent = "Image téléchargée. Vous pouvez maintenant la partager.";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      message.textContent = "Partage annulé.";
    } else {
      message.textContent = error.message || "Impossible de générer ou partager l’image.";
      message.classList.add("warning");
    }
  } finally {
    button.disabled = false;
  }
}

function renderGame() {
  if (!game) return;
  const current = activePlayer();
  const isCricket = game.mode === "cricket";
  document.querySelector("#game-mode-label").textContent = isCricket ? "MODE CRICKET" : `MODE ${game.mode}`;
  document.querySelector("#game-title").textContent = isCricket ? "Cricket" : game.mode;
  document.querySelector("#turn-label").textContent = game.winner ? "Partie terminée" : `Au tour de ${current.name}`;
  document.querySelector("#round-label").textContent = `TOUR ${game.round}`;
  document.querySelector("#active-player-name").textContent = game.winner
    ? `${game.players.find((player) => player.id === game.winner).name} a gagné`
    : current.name;
  document.querySelector("#darts-left").textContent = game.winner ? "TERMINÉ" : `${3 - game.dartsInVisit} FLÉCHETTE${3 - game.dartsInVisit > 1 ? "S" : ""}`;
  document.querySelector("#visit-score").textContent = String(game.visitScore);
  document.querySelector("#game-message").textContent = game.message;
  document.querySelector("#game-message").classList.toggle("warning", game.messageType === "warning");
  document.querySelector("#throw-button").disabled = Boolean(game.winner);
  document.querySelector("#segment-select").disabled = Boolean(game.winner);
  updateMultiplier();
  document.querySelector("#undo-button").disabled = history.length === 0;
  document.querySelector("#end-turn-button").disabled = Boolean(game.winner || game.dartsInVisit === 0);

  const winnerBanner = document.querySelector("#winner-banner");
  winnerBanner.hidden = !game.winner;
  if (game.winner) winnerBanner.textContent = `🏆 ${game.players.find((player) => player.id === game.winner).name} remporte la partie !`;
  document.querySelector("#share-button").hidden = !game.winner;
  document.querySelector("#share-help").hidden = !game.winner;

  const logList = document.querySelector("#log-list");
  logList.replaceChildren();
  if (game.log.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-log";
    empty.textContent = "Les premières fléchettes n'attendent que vous.";
    logList.append(empty);
  } else {
    for (const entry of game.log) {
      const item = document.createElement("li");
      const text = document.createElement("span");
      const score = document.createElement("strong");
      text.textContent = entry.text;
      score.textContent = typeof entry.score === "number" ? `${entry.score > 0 ? "+" : ""}${entry.score}` : entry.score;
      item.append(text, score);
      logList.append(item);
    }
  }

  renderScoreboard();
}

function startGame(event) {
  event.preventDefault();
  const names = [...playerList.querySelectorAll("input")]
    .map((input, index) => input.value.trim() || `Joueur ${index + 1}`);
  if (names.length < 2 || names.length > 8) return;

  history.length = 0;
  game = createGame(modeSelect.value, names, {
    doubleIn: document.querySelector("#double-in").checked,
    doubleOut: document.querySelector("#double-out").checked,
  });
  setupScreen.hidden = true;
  gameScreen.hidden = false;
  fillSegmentOptions(game.mode === "cricket");
  renderGame();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelector("#add-player").addEventListener("click", () => addPlayerField());
document.querySelector("#game-mode").addEventListener("change", updateModeOptions);
segmentSelect.addEventListener("change", updateMultiplier);
document.querySelector("#throw-button").addEventListener("click", throwDart);
document.querySelector("#share-button").addEventListener("click", shareResult);
document.querySelector("#end-turn-button").addEventListener("click", finishVisit);
document.querySelector("#back-button").addEventListener("click", () => {
  game = null;
  history.length = 0;
  setupScreen.hidden = false;
  gameScreen.hidden = true;
});
document.querySelector("#undo-button").addEventListener("click", () => {
  if (history.length === 0) return;
  game = history.pop();
  renderGame();
});
setupForm.addEventListener("submit", startGame);

addPlayerField("Joueur 1");
addPlayerField("Joueur 2");
updateModeOptions();
