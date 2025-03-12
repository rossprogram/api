{ lib, yarn2nix }:
yarn2nix.mkYarnPackage rec {
    name = "rossprogram-api";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      NODE_ENV=production yarn run build
    '';

    meta = with lib; {
      description = "Ross Program webservices";
      homepage = "https://github.com/rossprogram/api";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
