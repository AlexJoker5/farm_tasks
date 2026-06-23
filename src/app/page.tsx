import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
            <span className="pixel-text text-[8px] text-[var(--bg-primary)]">
              🌱
            </span>
          </div>
          <span className="pixel-text text-[10px] text-[var(--text-primary)]">
            Farm Tasks
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="btn-secondary !py-2 !px-5 !text-[0.55rem]"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn-primary !py-2 !px-5 !text-[0.55rem]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16">
        {/* Floating particles background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-2 h-2 rounded-full bg-[var(--accent-green)] opacity-20 animate-float"
            style={{ top: "15%", left: "10%", animationDelay: "0s" }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] opacity-15 animate-float"
            style={{ top: "30%", right: "15%", animationDelay: "1s" }}
          />
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)] opacity-20 animate-float"
            style={{ top: "60%", left: "20%", animationDelay: "2s" }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-[var(--accent-amber)] opacity-25 animate-float"
            style={{ top: "45%", right: "25%", animationDelay: "0.5s" }}
          />
          <div
            className="absolute w-2 h-2 rounded-full bg-[var(--accent-pink)] opacity-15 animate-float"
            style={{ top: "75%", right: "10%", animationDelay: "1.5s" }}
          />
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--accent-green)] opacity-[0.03] blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[var(--accent-purple)] opacity-[0.04] blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="pixel-text-sm text-[var(--text-secondary)]">
              Your garden awaits
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className="animate-fade-in-up delay-100 pixel-text text-3xl md:text-4xl lg:text-5xl leading-relaxed mb-6"
            style={{ opacity: 0, lineHeight: "1.8" }}
          >
            <span className="text-[var(--text-primary)]">Grow Your</span>
            <br />
            <span className="gradient-text">Productivity</span>
          </h1>

          {/* Subheading */}
          <p
            className="animate-fade-in-up delay-200 text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ opacity: 0 }}
          >
            Turn your real-world goals into a living pixel-art garden. Complete
            tasks, grow unique plants, and share your garden with friends in
            real-time.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ opacity: 0 }}
          >
            <Link href="/register" className="btn-primary text-sm">
              🌱 Start Growing
            </Link>
            <Link href="#features" className="btn-secondary text-sm">
              Learn More ↓
            </Link>
          </div>

          {/* ASCII Art Garden Preview */}
          <div
            className="animate-fade-in-up delay-400 mt-16 glass-card p-8 max-w-2xl mx-auto"
            style={{ opacity: 0 }}
          >
            <pre className="pixel-text text-[7px] md:text-[9px] text-[var(--accent-green)] leading-relaxed text-left overflow-x-auto">
              {`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🌳🌳          🌸🌸     🌻              ║
  ║   🌳🌳          🌸🌸                      ║
  ║                                          ║
  ║              🧑‍🌾                          ║
  ║             /  \\            🌺            ║
  ║                                          ║
  ║   🌿    🌱         🌲🌲                   ║
  ║                     🌲🌲     🌷           ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
              `}
            </pre>
            <p className="pixel-text-sm text-[var(--text-muted)] mt-4">
              ↑ Your garden could look like this
            </p>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 px-6 py-20 border-t border-[var(--border-default)]"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="pixel-text text-xl md:text-2xl text-center gradient-text mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-card p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--accent-green)]/20 to-[var(--accent-green)]/5 border border-[var(--accent-green)]/20 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="pixel-text-sm text-[var(--accent-green)] mb-3">
                Set Goals
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Create short, medium, or long-term goals. Each goal gets a
                unique seed that grows as you make progress.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--accent-amber)]/20 to-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/20 flex items-center justify-center">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="pixel-text-sm gradient-text-warm mb-3">
                Grow Plants
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Complete daily tasks to nurture your plants through four growth
                stages — from seed to a fully mature tree.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-purple)]/5 border border-[var(--accent-purple)]/20 flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="pixel-text-sm gradient-text-cool mb-3">
                Share & Explore
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Invite friends to walk through your garden in real-time. Every
                garden is a living monument to your productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plant Tiers Section */}
      <section className="relative z-10 px-6 py-20 bg-[var(--bg-secondary)] border-t border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="pixel-text text-xl md:text-2xl text-center mb-4 text-[var(--text-primary)]">
            Plant Tiers
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-12">
            The longer your commitment, the grander the reward
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center animate-pulse-glow">
              <span className="text-4xl block mb-3">🌸</span>
              <h3 className="pixel-text-sm text-[var(--accent-green)] mb-2">
                Short-Term
              </h3>
              <p className="pixel-text-sm text-[var(--text-muted)] mb-2">
                &lt; 1 month
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Flowers & Bushes
              </p>
            </div>

            <div className="glass-card p-6 text-center animate-pulse-glow">
              <span className="text-4xl block mb-3">🌳</span>
              <h3 className="pixel-text-sm text-[var(--accent-amber)] mb-2">
                Medium-Term
              </h3>
              <p className="pixel-text-sm text-[var(--text-muted)] mb-2">
                1–6 months
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Standard Trees
              </p>
            </div>

            <div className="glass-card p-6 text-center animate-pulse-glow">
              <span className="text-4xl block mb-3">🌲</span>
              <h3 className="pixel-text-sm text-[var(--accent-purple)] mb-2">
                Long-Term
              </h3>
              <p className="pixel-text-sm text-[var(--text-muted)] mb-2">
                6–12 months
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Grand & Mythical Trees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-[var(--border-default)] bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="pixel-text text-[8px] text-[var(--text-muted)]">
              🌱 Farm Tasks
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Grow your productivity, one task at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
