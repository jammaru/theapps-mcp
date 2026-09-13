{
  description = "Optional Nix toolchain for theapps-mcp (Bun MCP server + Node website)";

  # Rolling nixpkgs so Bun stays recent. JS deps stay in bun.lock / package-lock.json.
  # Pattern: the-nix-way/dev-templates (bun + node), no flake-utils / flake-parts.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, ... }@inputs:
    let
      inherit (inputs.nixpkgs) lib;

      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forEachSupportedSystem =
        f:
        lib.genAttrs supportedSystems (
          system:
          f {
            inherit system;
            pkgs = inputs.nixpkgs.legacyPackages.${system};
          }
        );
    in
    {
      # Official Nix formatter (RFC 166) via treefmt. `nix fmt` / `treefmt --ci`.
      formatter = forEachSupportedSystem ({ pkgs, ... }: pkgs.nixfmt-tree);

      devShells = forEachSupportedSystem (
        { pkgs, system }:
        {
          default = pkgs.mkShellNoCC {
            packages = [
              pkgs.bun
              pkgs.nodejs_22
              self.formatter.${system}
            ];

            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
            '';
          };
        }
      );

      # So `nix flake check` actually evaluates the shell, not only the formatter.
      checks = forEachSupportedSystem (
        { system, ... }:
        {
          dev-shell = self.devShells.${system}.default;
        }
      );
    };
}
