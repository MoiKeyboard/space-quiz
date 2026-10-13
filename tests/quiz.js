(() => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const bank = questions.slice();
  const snapshot = JSON.stringify(questions);
  const originalRandom = Math.random;
  const originalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
  let storedBest = null;
  let writes = 0;
  const storage = {
    getItem(key) {
      assert(key === personalBestKey, "Read the dedicated personal-best key");
      return storedBest;
    },
    setItem(key, value) {
      assert(key === personalBestKey, "Write the dedicated personal-best key");
      storedBest = value;
      writes++;
    }
  };
  const useStorage = (value) => Object.defineProperty(window, "localStorage", {
    configurable: true, get: () => value
  });
  let assertions = 0;
  const check = (condition, message) => {
    assert(condition, message);
    assertions++;
  };
  const checkOrder = (order) => {
    check(order !== questions, "An attempt must use a copy of the bank");
    check(order.length === 10 && new Set(order).size === 10, "Ten unique records per attempt");
    check(bank.every((item) => order.includes(item)), "Every canonical record is present");
    check(JSON.stringify(questions) === snapshot, "The canonical bank and records are unchanged");
  };
  const track = document.querySelector(".track");
  const checkProgress = (count) => {
    check($("progress").style.width === `${count * 10}%` ||
      (count === 0 && $("progress").style.width === ""), "Answered progress fill");
    check($("progress-percent").textContent === `${count * 10}%`, "Answered progress percentage");
    check(track.getAttribute("aria-valuenow") === String(count), "Answered progress ARIA value");
    check(track.getAttribute("aria-valuetext") === `${count} of 10 questions answered`, "Answered progress ARIA text");
  };

  try {
    useStorage(storage);
    check(current === 0 && score === 0 && !answered, "Run checks at the start of an attempt");
    checkOrder(attemptQuestions);
    checkProgress(0);
    check(document.activeElement !== $("question"), "Initial render does not force question focus");
    check($("feedback").getAttribute("aria-live") === "polite", "Feedback announcements remain polite");
    check($("score-counter").getAttribute("aria-live") === "polite", "Score announcements remain polite");

    // Boundary draws also demonstrate that repeating an order is valid.
    let draws = 0;
    Math.random = () => { draws++; return 1 - Number.EPSILON; };
    check(shuffleQuestions().every((item, i) => item === bank[i]), "Upper boundary draws can preserve order");
    check(draws === 9, "Fisher-Yates draws once per swap");
    Math.random = () => 0;
    check(shuffleQuestions().every((item, i) => item === bank[(i + 1) % 10]), "Lower boundary draws swap complete records");
    check(JSON.stringify(questions) === snapshot, "Shuffle does not mutate the bank");
    Math.random = originalRandom;

    const attempts = [];
    let expectedBest = null;
    for (const targetScore of [0, 4, 5, 7, 8, 10, 10, 3]) {
      const previousBest = storedBest;
      const previousWrites = writes;
      const previousOrder = attemptQuestions;
      draws = 0;
      Math.random = () => { draws++; return originalRandom(); };
      $("restart").click();
      Math.random = originalRandom;
      check(draws === 9, "Restart shuffles exactly once");
      check(attemptQuestions !== previousOrder, "Restart creates a fresh attempt array");
      checkOrder(attemptQuestions);
      const order = attemptQuestions.slice();
      const seen = [];
      check(current === 0 && score === 0 && !answered, "Restart resets quiz state");
      check(!$("quiz").hidden && $("results").hidden, "Restart restores the quiz view");
      check(document.activeElement === $("question"), "Restart focuses the question");
      checkProgress(0);

      for (let i = 0; i < 10; i++) {
        const item = bank.find((record) => record.question === $("question").textContent);
        check(item === order[i], "Display follows the fixed attempt order");
        seen.push(item);
        check($("category").textContent === item.category, "Category remains associated");
        check($("question-number").textContent === String(i + 1), "Question numbering");
        check($("mission-status").textContent === "Awaiting input", "Unanswered mission status");
        const buttons = Array.from($("options").children);
        check(buttons.every((button, j) => button.querySelector(".answer-text").textContent === item.options[j]), "Option order remains unchanged");
        check($("next").disabled && $("feedback").hidden, "Unanswered question is gated");
        $("next").dispatchEvent(new MouseEvent("click"));
        check(current === i && $("results").hidden, "Next handler rejects unanswered advancement");
        checkProgress(i);

        const correct = i < targetScore;
        const selected = correct ? item.answer : (item.answer + 1) % item.options.length;
        const expectedScore = Math.min(i + 1, targetScore);
        buttons[selected].click();
        check(score === expectedScore, "Score matches the displayed record");
        check(buttons.every((button) => button.disabled), "All answers lock after selection");
        check(buttons[item.answer].classList.contains("correct"), "Correct option is revealed");
        check(buttons[item.answer].getAttribute("aria-label") === `${item.options[item.answer]} — correct answer`, "Correct-answer accessible label");
        check(correct || buttons[selected].classList.contains("wrong"), "Incorrect selection is marked");
        check($("feedback").classList.contains(correct ? "correct" : "wrong"), "Feedback correctness");
        check($("feedback").querySelector("span").textContent === item.fact, "Explanation remains associated");
        check(!$("feedback").hidden && !$("next").disabled, "Feedback and continuation appear");
        check(document.activeElement === $("next"), "Answering focuses Next");
        checkProgress(i + 1);
        check($("mission-status").textContent === (i === 9 ? "Ready for debrief" : "Answer logged"), "Answered mission status");
        buttons[selected].dispatchEvent(new MouseEvent("click"));
        selectAnswer(item.answer);
        check(score === expectedScore && $("feedback").children.length === 2, "Duplicate answers do not score or repeat feedback");
        check(attemptQuestions.every((record, j) => record === order[j]), "Answering does not reshuffle");
        check($("next-label").textContent === (i === 9 ? "See my results" : "Next question"), "Final-question continuation label");
        check(storedBest === previousBest && writes === previousWrites, "Unfinished attempts never save a best, including the last answer");
        $("next").click();
        check(attemptQuestions.every((record, j) => record === order[j]), "Advancing does not reshuffle");
        check(document.activeElement === (i === 9 ? $("result-title") : $("question")), "Advancement focus");
      }

      check(new Set(seen).size === 10 && bank.every((item) => seen.includes(item)), "All ten unique questions were displayed");
      check($("quiz").hidden && !$("results").hidden, "Final answer leads to results");
      check($("correct-count").textContent === String(targetScore), "Result correct count");
      check($("wrong-count").textContent === String(10 - targetScore), "Result incorrect count");
      check($("result-score").textContent === `${targetScore} / 10`, "Result score total");
      check($("accuracy").textContent === `${targetScore * 10}%`, "Result accuracy");
      const improved = expectedBest === null || targetScore > expectedBest;
      expectedBest = expectedBest === null ? targetScore : Math.max(expectedBest, targetScore);
      check(storedBest === String(expectedBest), "Only a higher completed score replaces the saved best");
      check(writes === previousWrites + Number(improved), "Tied and lower scores do not write storage");
      check($("personal-best").textContent === `${expectedBest} / 10`, "Results show the browser-local best, including zero");
      check($("storage-note").textContent.includes("Not synced"), "Storage scope is explicit");
      check($("result-title").textContent === (targetScore >= 8 ? "You're a cosmic pro!" :
        targetScore >= 5 ? "A star in the making!" : "Your journey is just beginning!"), "Result-tier boundaries");
      checkProgress(10);
      checkOrder(attemptQuestions);
      attempts.push({ score: targetScore, questions: seen.map((item) => item.question) });
    }
    const complete = (targetScore) => {
      $("restart").click();
      for (let i = 0; i < questions.length; i++) {
        const item = attemptQuestions[current];
        $("options").children[i < targetScore ? item.answer : (item.answer + 1) % item.options.length].click();
        $("next").click();
      }
    };
    for (const invalid of [null, "", " ", "NaN", "Infinity", "-1", "11", "4.5", "04", "4 points", "null", "{}"]) {
      storedBest = invalid;
      const previousWrites = writes;
      complete(4);
      check(storedBest === "4" && writes === previousWrites + 1, "Missing or invalid best is replaced on completion");
      check($("personal-best").textContent === "4 / 10", "Invalid values never appear as scores");
    }
    storedBest = "9";
    complete(4);
    check($("personal-best").textContent === "9 / 10", "A pre-existing saved best is read on completion");

    const unavailable = () => { throw new DOMException("Storage blocked for test", "SecurityError"); };
    const failures = [
      () => Object.defineProperty(window, "localStorage", { configurable: true, get: unavailable }),
      () => useStorage({ getItem: unavailable, setItem: storage.setItem }),
      () => useStorage({ getItem: () => null, setItem: unavailable })
    ];
    for (const fail of failures) {
      fail();
      complete(5);
      check($("personal-best").textContent === "Unavailable", "Storage failure never claims a saved score");
      check($("storage-note").textContent.includes("Personal best cannot be saved"), "Storage failure is visible");
      check($("result-score").textContent === "5 / 10", "Storage failure does not break scoring");
      check(document.activeElement === $("result-title"), "Storage failure preserves results focus");
      $("restart").click();
      check(current === 0 && score === 0 && !$("quiz").hidden, "Storage failure does not break replay");
    }
    useStorage(storage);
    storedBest = null;
    complete(6);
    check(storedBest === "6" && $("personal-best").textContent === "6 / 10", "Saving recovers when storage becomes available");
    console.log(`Passed ${assertions} quiz assertions across ${attempts.length} attempts.`, attempts);
    return { assertions, attempts };
  } finally {
    Math.random = originalRandom;
    if (originalStorage) Object.defineProperty(window, "localStorage", originalStorage);
    else delete window.localStorage;
    $("restart").click();
  }
})();
