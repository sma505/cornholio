{
  description = "Cornholio - Cornhole Tournament Webapp";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.npm
          ];

          shellHook = ''
            echo "🌽 Cornholio dev environment loaded"
            echo "Node: $(node --version)"
            echo "npm: $(npm --version)"
          '';
        };
      });
}
