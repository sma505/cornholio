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
        playwright-browsers = pkgs.playwright-driver.browsers;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.npm
            playwright-driver.browsers
          ];

          shellHook = ''
            echo "🌽 Cornholio dev environment loaded"
            echo "Node: $(node --version)"
            echo "npm: $(npm --version)"
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

            # Don't export PLAYWRIGHT_BROWSERS_PATH globally — it breaks MCP Playwright
            # which inherits the read-only Nix store path and tries to mkdir inside it.
            # Store it so npm scripts can reference it via cross-env or direct use.
            export NIX_PLAYWRIGHT_BROWSERS_PATH="${playwright-browsers}"
          '';
        };
      });
}
