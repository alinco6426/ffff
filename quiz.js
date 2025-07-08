let quizData = {};
let selectedCourse = "";
let selectedTopic = "";
let selectedType = "";
let selectedQuestions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];

const courseSelect = document.getElementById("course-select");
const topicSelect = document.getElementById("topic-select");
const typeSelect = document.getElementById("type-select");
const questionRange = document.getElementById("question-range");
const availableText = document.getElementById("total-available");

window.onload = async () => {
  try {
    const res = await fetch("/questions.json");
    quizData = await res.json();
    populateCourses();
  } catch (err) {
    alert("Error loading questions.");
    console.error(err);
  }
};

function populateCourses() {
  for (const course in quizData) {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseSelect.appendChild(option);
  }

  courseSelect.addEventListener("change", populateTopics);
  topicSelect.addEventListener("change", () => {
    updateAvailableCount();
    updateQuestionRangeOptions();
  });
  typeSelect.addEventListener("change", () => {
    updateAvailableCount();
    updateQuestionRangeOptions();
  });

  courseSelect.dispatchEvent(new Event("change"));
}

function populateTopics() {
  topicSelect.innerHTML = "";
  const topics = Object.keys(quizData[courseSelect.value]);
  topics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicSelect.appendChild(option);
  });

  topicSelect.dispatchEvent(new Event("change"));
}

function updateAvailableCount() {
  const course = courseSelect.value;
  const topic = topicSelect.value;
  const type = typeSelect.value;
  if (quizData[course] && quizData[course][topic] && quizData[course][topic][type]) {
    availableText.textContent = `Available: ${quizData[course][topic][type].length}`;
  } else {
    availableText.textContent = `Available: 0`;
  }
}

function updateQuestionRangeOptions() {
  const total = quizData[courseSelect.value]?.[topicSelect.value]?.[typeSelect.value]?.length || 0;
  questionRange.innerHTML = "";

  if (total === 0) {
    const opt = document.createElement("option");
    opt.value = 0;
    opt.textContent = "No questions available";
    questionRange.appendChild(opt);
    return;
  }

  const commonRanges = [5, 10, 20, 30, 50,60,80,90];
  commonRanges.forEach(r => {
    if (r <= total) {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = `1–${r}`;
      questionRange.appendChild(opt);
    }
  });

  // Always add "All"
  const allOpt = document.createElement("option");
  allOpt.value = total;
  allOpt.textContent = `All (${total})`;
  questionRange.appendChild(allOpt);
}

function startQuiz() {
  selectedCourse = courseSelect.value;
  selectedTopic = topicSelect.value;
  selectedType = typeSelect.value;
  const num = parseInt(questionRange.value);

  const allQuestions = quizData[selectedCourse]?.[selectedTopic]?.[selectedType];
  if (!allQuestions || allQuestions.length === 0) {
    alert("No questions found!");
    return;
  }

  selectedQuestions = allQuestions.slice(0, num);
  currentIndex = 0;
  score = 0;
  userAnswers = [];

  document.getElementById("selection-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");

  showQuestion();
}

function showQuestion() {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  const current = selectedQuestions[currentIndex];
  const block = document.createElement("div");
  block.className = "question";

  block.innerHTML = `<strong>Q${currentIndex + 1}: ${current.question}</strong><br/>`;

  if (selectedType === "mcqs") {
    current.options.forEach((opt, i) => {
      const div = document.createElement("div");
      div.className = "answer-block";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = i;
      input.id = `opt-${i}`;

      const label = document.createElement("label");
      label.htmlFor = `opt-${i}`;
      label.textContent = opt;

      div.appendChild(input);
      div.appendChild(label);
      block.appendChild(div);
    });
  } else if (selectedType === "fitg") {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "fitg-answer";
    input.placeholder = "Type your answer here";
    block.appendChild(input);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = currentIndex < selectedQuestions.length - 1 ? "Next" : "Finish";
  nextBtn.onclick = handleAnswer;

  block.appendChild(nextBtn);
  container.appendChild(block);
}

function handleAnswer() {
  const current = selectedQuestions[currentIndex];
  let userAnswer = null;
  let isCorrect = false;
  let displayedAnswer = "";

  if (selectedType === "mcqs") {
    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) return alert("Please select an answer!");
    const selectedIndex = parseInt(selected.value);
    userAnswer = selectedIndex;
    displayedAnswer = current.options[selectedIndex];
    isCorrect = selectedIndex === current.correctIndex;
  } else if (selectedType === "fitg") {
    const input = document.getElementById("fitg-answer");
    const answer = input.value.trim();
    if (!answer) return alert("Please type an answer!");
    userAnswer = answer.toLowerCase();
    displayedAnswer = answer;
    isCorrect = userAnswer === current.answer.trim().toLowerCase();
  }

  if (isCorrect) score++;

  userAnswers.push({
    question: current.question,
    userAnswer: displayedAnswer,
    correctAnswer: selectedType === "mcqs" ? current.options[current.correctIndex] : current.answer,
    explanation: current.explanation,
    isCorrect
  });

  currentIndex++;
  if (currentIndex < selectedQuestions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  document.getElementById("score").textContent = `${score} out of ${selectedQuestions.length}`;
  const corrections = document.getElementById("corrections");
  corrections.innerHTML = "<h3>Corrections:</h3>";

  userAnswers.forEach((entry, i) => {
    if (!entry.isCorrect) {
      const block = document.createElement("div");
      block.className = "correction";
      block.innerHTML = `
        <p><strong>Q${i + 1}: ${entry.question}</strong></p>
        <p><span style="color: red;">Your Answer:</span> ${entry.userAnswer}</p>
        <p><span style="color: green;">Correct Answer:</span> ${entry.correctAnswer}</p>
        <p><em>${entry.explanation || ""}</em></p>
      `;
      corrections.appendChild(block);
    }
  });
}
