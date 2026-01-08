{ pkgs ? import <nixpkgs> {} }:
pkgs.buildNpmPackage rec {
  pname = "rossprogram-api";
  version = "1.5.0";
  src = ./.;

  # pkgs.lib.fakeHash;
  npmDepsHash = "sha256-pHeWf8Y1oPlB7ScqUGPBumZk9QdGFr/LlAUhUqdZ5OQ=";
  npmBuildScript = "build";

  postInstall = ''
    if [ -x "$out/bin/api" ] && [ ! -e "$out/bin/rossprogram-api" ]; then
      ln -s "$out/bin/api" "$out/bin/rossprogram-api"
    fi
  '';

  meta = with pkgs.lib; {
    description = "Ross Program webservices";
    homepage = "https://github.com/rossprogram/api";
    maintainers = with maintainers; [ kisonecat ];
    platforms = platforms.linux;
  };
}
