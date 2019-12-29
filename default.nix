{ stdenv, yarn2nix }:
yarn2nix.mkYarnPackage rec {
    name = "ross-api";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      NODE_ENV=production yarn run build
    '';

    meta = with stdenv.lib; {
      description = "Ross Program web services";
      license = licenses.agpl3;
      homepage = "https://github.com/rossprogram/api";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
