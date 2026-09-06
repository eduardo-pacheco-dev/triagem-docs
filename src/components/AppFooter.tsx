export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span>AFL Engenharia — Triagem Docs</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}