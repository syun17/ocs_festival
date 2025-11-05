document.addEventListener('DOMContentLoaded', function() {
    const quiz = [
        {
            question:"枝分かれしたブランチを合流させるには、どのコマンドを使うべきか？",
            choices:[
                "git branch",
                "git add",
                "git commit",
                "git merge"
            ],
            answer: "git merge"
        },{
            question:"ブランチを合流させた後不要になったブランチを削除するには、どのコマンドを使うべきか？",
            choices:[
                "git add",
                "git pull",
                "git branch -d ブランチ名",
                "git checkout -b ブランチ名"
            ],
            answer: "git branch -d ブランチ名"
        }
    ];

    const questionElement = document.getElementById('question');
    const choicesElement = document.getElementById('choices');
    const nextBtn = document.getElementById('nextBtn');
    // ▼▼▼ 修正箇所 ▼▼▼
    const resultElement = document.getElementById('result'); // result要素を取得する行を追加

    let currentQuestionIndex = 0;
    let score = 0;

    function displayQuestion(){
        resultElement.textContent = '';
        nextBtn.style.display = 'none';

        const currentQuestion = quiz[currentQuestionIndex];
        questionElement.textContent = `${currentQuestionIndex + 1}問目: ${currentQuestion.question}`;
        choicesElement.innerHTML = '';

        currentQuestion.choices.forEach(choice => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = choice;
            button.addEventListener('click', function(){
                // 全ての選択肢ボタンを無効化
                const allButtons = choicesElement.querySelectorAll('button');
                allButtons.forEach(btn => btn.disabled = true);

                if(choice === currentQuestion.answer){
                    score++;
                    resultElement.innerHTML = '<h1 class="correct">⭕️</h1><p>正解！</p>';
                } else {
                    resultElement.innerHTML = `<h1 class="incorrect">❌</h1><p>不正解！正解は: ${currentQuestion.answer}</p>`;
                }
                nextBtn.style.display = 'inline';
            });
            li.appendChild(button);
            choicesElement.appendChild(li);
        });
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quiz.length) {
            displayQuestion();
        } else {
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = `
                <h1>クイズ終了！お疲れ様でした。</h1>
                <h2>${quiz.length}問中${score}問正解です！</h2>
                <a href="section7.html">section7へ</a>
            `;
        }
    });

    displayQuestion();
});