setup direnv
install, then
mkdir -p ~/.config/direnv
touch ~/.config/direnv/direnv.toml
add
```
[global]
load_dotenv = true
```
run
`direnv allow`
in the root project dir(where .env is located)