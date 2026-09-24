# GoodMec — como atualizar o GitHub

Repositório: https://github.com/okaioccesar/good_mec

Esta pasta está conectada ao remoto chamado `origin`. A branch de trabalho é `main`.

## Depois de alterar o projeto

Abra o terminal na pasta `C:\GoodMec(Descomplica)` e execute os comandos um por vez:

```powershell
git status
git add .
git diff --staged --stat
git commit -m "Descreva aqui o que você alterou"
git push
```

| Comando | O que faz |
| --- | --- |
| `git status` | Mostra arquivos novos, modificados e preparados para o próximo commit. |
| `git add .` | Prepara as alterações desta pasta. Arquivos definidos no `.gitignore` ficam de fora, desde que não tenham sido versionados antes. |
| `git diff --staged --stat` | Mostra um resumo do que será incluído. Use `git diff --staged` para conferir o conteúdo completo. |
| `git commit -m "..."` | Registra uma versão no histórico local, com uma mensagem explicando a mudança. |
| `git push` | Envia os commits locais para a branch vinculada no GitHub. |

Confira os arquivos antes de fazer o commit. Para preparar somente arquivos específicos, você pode usar, por exemplo, `git add index.html style.css`.

## Conferir a conexão

```powershell
git remote -v
git branch -vv
```

`origin` é o apelido do repositório remoto. `main` é o nome da branch. A indicação `origin/main` em `git branch -vv` mostra a branch remota acompanhada por esta pasta.

## Se o GitHub tiver alterações que não estão nesta pasta

Com suas alterações locais já salvas em commit, use:

```powershell
git pull --rebase
git push
```

Se aparecer um conflito, resolva os arquivos indicados antes de continuar. Não use `--force` para tentar resolver esse aviso.

## Por que a primeira vinculação é diferente?

`git init` cria o repositório local. `git remote add origin URL` registra o endereço do GitHub. Na primeira publicação, `git push -u origin main` também configura o acompanhamento da branch; depois basta `git push`.

Você não precisa repetir `git init` nem `git remote add` neste projeto. O histórico inicial e o `README.md` que já estavam no GitHub foram preservados.

## Arquivos ignorados

- `node_modules/`: dependências de teste, que podem ser reinstaladas com `npm ci`.
- `*.log`: arquivos de log.
- `.env` e `.env.*`: futuras credenciais locais. Um `.env.example` pode conter apenas nomes de variáveis e valores fictícios.
- `goodmec-*.json`: cópias exportadas pelo aplicativo, que podem conter dados de clientes.

O `.gitignore` não remove um arquivo que já tenha sido enviado anteriormente. Nunca coloque senhas ou tokens diretamente nos arquivos do projeto.
