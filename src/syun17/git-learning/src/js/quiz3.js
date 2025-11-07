document.addEventListener('DOMContentLoaded', function() {
    const quiz = [
        {
            question:"最初にどのような操作を行うべきか？",
            choices:[
                "git cloneでリポジトリをコピーする",
                "git commitで変更を保存する",
                "git pushで変更をリモートに送信する",
                "git branchで新しいブランチを作成する"
            ],
            answer: "git cloneでリポジトリをコピーする"
        },{
            question:"リモートリポジトリが更新されたみたいです。ファイルに反映させずに最新の状態を取得するには？",
            choices:[
                "git fetch",
                "git commit",
                "git push",
                "git pull"
            ],
            answer: "git fetch"
        }
    ];

    const questionElement = document.getElementById('question');
    const choicesElement = document.getElementById('choices');
    const nextBtn = document.getElementById('nextBtn');
    const resultElement = document.getElementById('result');

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
                <a href="section4.html">section4へ</a>
            `;
        }
    });

    displayQuestion();
});