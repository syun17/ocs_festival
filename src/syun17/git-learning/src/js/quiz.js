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
            question:"リモートリポジトリが更新されたみたいです。最新の状態を取得するには？",
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
    // ▼▼▼ 修正箇所 ▼▼▼
    const resultElement = document.getElementById('result'); // result要素を取得する行を追加

    let currentQuestionIndex = 0;
    
    function displayQuestion(){
        resultElement.textContent = '';
        nextBtn.style.display = 'none';

        const currentQuestion = quiz[currentQuestionIndex];
        questionElement.textContent = `${currentQuestionIndex + 1}問: ${currentQuestion.question}`;
        choicesElement.innerHTML = '';

        // ボタンがクリックされた後、他のボタンを押せないようにする
        const buttons = choicesElement.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);

        currentQuestion.choices.forEach(choice => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = choice;
            button.addEventListener('click', function(){
                if(choice === currentQuestion.answer){
                    resultElement.textContent = '正解！';
                } else {
                    resultElement.textContent = `不正解！正しい答えは: ${currentQuestion.answer}`;
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
            quizContainer.innerHTML = '<h1>クイズ終了！お疲れ様でした。</h1><a href="section4.html">section4へ</a>';
        }
    });

    displayQuestion();
});