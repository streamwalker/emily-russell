import SwiftUI

// TODO(claude-code): implement per ios-handoff/03-screen-specs/02-legal-pages.md
struct LegalDocumentView: View {
    let title: String
    let resourceName: String
    var body: some View {
        ScrollView { Text(loadMarkdown(resourceName)).padding() }
            .navigationTitle(title)
    }

    private func loadMarkdown(_ name: String) -> String {
        guard let url = Bundle.main.url(forResource: name, withExtension: "md"),
              let data = try? String(contentsOf: url, encoding: .utf8) else {
            return "Legal copy missing — see ios-handoff/08-compliance.md."
        }
        return data
    }
}
