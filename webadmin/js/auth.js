const form = document.getElementById("formLogin");

form.addEventListener("submit", login);

async function login(e) {

    e.preventDefault();

    const login = document.getElementById("email").value.trim();

    const senha = document.getElementById("senha").value;

    try {

        const resposta = await fetch(`${API_URL}/auth/login`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                login,
                senha

            })

        });

        const dados = await resposta.json();

        if (!dados.sucesso) {

            alert(dados.mensagem);

            return;

        }

        localStorage.setItem(

            "token",

            dados.token

        );

        localStorage.setItem(

            "usuario",

            JSON.stringify(dados.usuario)

        );

        window.location.href = "dashboard.html";

    }

    catch (erro) {

        console.error(erro);

        alert("Erro ao conectar ao servidor.");

    }

}