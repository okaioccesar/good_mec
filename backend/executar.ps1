# Etapa 1: parametros opcionais para executar a API ou seus testes.
param(
    [int]$Porta = 8080,
    [switch]$Testar
)

# Interrompe o script se um comando PowerShell falhar.
$ErrorActionPreference = 'Stop'

# PSScriptRoot aponta para a pasta deste script, mesmo se o terminal estiver em outra pasta.
$pastaFontes = Join-Path $PSScriptRoot 'src'
$pastaClasses = Join-Path $PSScriptRoot 'out'
$fontesJava = @(Get-ChildItem -LiteralPath $pastaFontes -Filter '*.java' -Recurse | ForEach-Object { $_.FullName })
New-Item -ItemType Directory -Path $pastaClasses -Force | Out-Null

# Etapa 2: javac transforma os arquivos .java em bytecode .class; nao baixa dependencias.
& javac --release 21 -encoding UTF-8 -d $pastaClasses @fontesJava
if ($LASTEXITCODE -ne 0) {
    throw 'A compilacao falhou. Confira os erros acima.'
}

# Etapa 3: Node so participa dos testes; a API em si depende apenas do Java.
if ($Testar) {
    & node --test (Join-Path $PSScriptRoot 'testes\api.test.js')
} else {
    & java -cp $pastaClasses br.com.goodmec.Aplicacao $Porta
}
if ($LASTEXITCODE -ne 0) {
    throw 'A execucao terminou com erro. Confira as mensagens acima.'
}
