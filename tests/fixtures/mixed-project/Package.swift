// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "mixed",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(name: "mixed")
    ]
)
