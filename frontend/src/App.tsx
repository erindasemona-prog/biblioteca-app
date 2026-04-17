import { useEffect, useState } from "react";
import "./App.css";

type Book = {
  id: number;
  title: string;
  author: string;
  totalCopies: number;
  available: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  points: number;
};

type Loan = {
  id: number;
  bookId: number;
  userId: number;
  startDate: string;
  endDate: string;
  returned: boolean;
  book?: {
    id: number;
    title: string;
    author: string;
  };
};

function App() {
  const getStoredUser = (): User | null => {
    const saved = localStorage.getItem("biblioteca_current_user");
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved) as User;
      return parsed?.id ? parsed : null;
    } catch {
      localStorage.removeItem("biblioteca_current_user");
      return null;
    }
  };

  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalCopies, setTotalCopies] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [message, setMessage] = useState("");

  const validateAndNormalizeBooks = (data: unknown): Book[] => {
    if (!Array.isArray(data)) return [];

    const seen = new Set<number>();
    const cleanBooks: Book[] = [];

    for (const item of data) {
      if (!item || typeof item !== "object") continue;

      const raw = item as Partial<Book>;
      const id = Number(raw.id);
      const titleValue = typeof raw.title === "string" ? raw.title.trim() : "";
      const authorValue = typeof raw.author === "string" ? raw.author.trim() : "";
      const totalCopiesValue = Number(raw.totalCopies);
      const availableValue = Number(raw.available);

      const isValid =
        Number.isInteger(id) &&
        !seen.has(id) &&
        titleValue.length > 0 &&
        authorValue.length > 0 &&
        Number.isFinite(totalCopiesValue) &&
        totalCopiesValue >= 0 &&
        Number.isFinite(availableValue) &&
        availableValue >= 0;

      if (!isValid) continue;

      seen.add(id);
      cleanBooks.push({
        id,
        title: titleValue,
        author: authorValue,
        totalCopies: totalCopiesValue,
        available: availableValue,
      });
    }

    return cleanBooks;
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const loadBooks = async () => {
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      const cleanBooks = validateAndNormalizeBooks(data);
      setBooks(cleanBooks);
    } catch (error) {
      console.error("Errore nel caricamento libri:", error);
      setMessage("Errore nel caricamento dei libri");
    }
  };

  const loadUserLoans = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/loans`);
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Errore nel caricamento prestiti:", error);
      setMessage("Errore nel caricamento prestiti");
    }
  };

  const loadUserPoints = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/points`);
      const data = await res.json();
      if (!res.ok) return;

      setCurrentUser((prev) => {
        if (!prev || prev.id !== userId) return prev;
        return { ...prev, points: Number(data.points ?? prev.points) };
      });
    } catch (error) {
      console.error("Errore nel caricamento punti:", error);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialBooks = async () => {
      try {
        const res = await fetch("/api/books");
        const data = await res.json();
        if (active) {
          setBooks(validateAndNormalizeBooks(data));
        }
      } catch (error) {
        if (active) {
          console.error("Errore nel caricamento libri:", error);
          setMessage("Errore nel caricamento dei libri");
        }
      }
    };

    void loadInitialBooks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;

    fetch(`/api/users/${userId}/loans`)
      .then((res) => res.json())
      .then((data) => {
        setLoans(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Errore nel caricamento prestiti:", error);
      });

    fetch(`/api/users/${userId}/points`)
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser((prev) => {
          if (!prev || prev.id !== userId) return prev;
          return { ...prev, points: Number(data.points ?? prev.points) };
        });
      })
      .catch((error) => {
        console.error("Errore nel caricamento punti:", error);
      });
  }, [currentUser?.id]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName || !registerEmail || !registerPassword) {
      setMessage("Compila tutti i campi registrazione");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Registrazione non riuscita");
        return;
      }

      setMessage("Registrazione completata, ora fai login");
      setAuthMode("login");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Errore del server durante registrazione");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      setMessage("Inserisci email e password");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Login non riuscito");
        return;
      }

      const loggedUser = data.user as User;
      setCurrentUser(loggedUser);
      localStorage.setItem("biblioteca_current_user", JSON.stringify(loggedUser));
      setMessage(`Benvenuta ${loggedUser.name}`);
      setLoginPassword("");
      void loadUserLoans(loggedUser.id);
      void loadUserPoints(loggedUser.id);
    } catch (error) {
      console.error(error);
      setMessage("Errore del server durante login");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoans([]);
    localStorage.removeItem("biblioteca_current_user");
    setMessage("Logout effettuato");
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !author || !totalCopies) {
      setMessage("Compila tutti i campi");
      return;
    }

    if (!currentUser) {
      setMessage("Fai login per aggiungere libri");
      return;
    }

    if (Number(totalCopies) <= 0) {
      setMessage("Le copie devono essere maggiori di 0");
      return;
    }

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUser.id),
        },
        body: JSON.stringify({
          title,
          author,
          totalCopies: Number(totalCopies),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Errore nell'aggiunta del libro");
        return;
      }

      setMessage("Libro aggiunto con successo");
      setTitle("");
      setAuthor("");
      setTotalCopies("");
      void loadBooks();
    } catch (error) {
      console.error("Errore aggiunta libro:", error);
      setMessage("Errore del server");
    }
  };

  const handleBorrow = async (bookId: number) => {
    if (!currentUser) {
      setMessage("Devi fare login per prendere un libro in prestito");
      return;
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUser.id),
        },
        body: JSON.stringify({
          userId: currentUser.id,
          bookId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Errore nel prestito");
        return;
      }

      setMessage("Libro preso in prestito con successo");
      void loadBooks();
      void loadUserLoans(currentUser.id);
      void loadUserPoints(currentUser.id);
      scrollToSection("catalogo");
    } catch (error) {
      console.error("Errore prestito libro:", error);
      setMessage("Errore del server");
    }
  };

  const handleReturnLoan = async (loanId: number) => {
    if (!currentUser) {
      setMessage("Devi fare login per restituire un libro");
      return;
    }

    try {
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUser.id),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Errore nella restituzione");
        return;
      }

      setMessage(data.message || "Libro restituito con successo");
      void loadBooks();
      void loadUserLoans(currentUser.id);
      void loadUserPoints(currentUser.id);
    } catch (error) {
      console.error("Errore restituzione:", error);
      setMessage("Errore del server durante la restituzione");
    }
  };

  const openLoans = loans.filter((loan) => !loan.returned);

  if (!currentUser) {
    return (
      <div className="app-shell auth-page">
        <section className="hero-section hero-section-dark auth-hero">
          <h1 className="hero-title hero-title-large hero-title-white">
            Benvenuto in Biblioteca
          </h1>
          <p className="hero-subtitle">Accedi o registrati per gestire libri, prestiti e punti fedelta.</p>
        </section>

        <section className="auth-page-content">
          <div className="auth-switch">
            <button
              className={`auth-switch-btn ${authMode === "login" ? "active" : ""}`}
              onClick={() => setAuthMode("login")}
            >
              Pagina Login
            </button>
            <button
              className={`auth-switch-btn ${authMode === "register" ? "active" : ""}`}
              onClick={() => setAuthMode("register")}
            >
              Pagina Registrazione
            </button>
          </div>

          {authMode === "login" ? (
            <form className="auth-card auth-card-page" onSubmit={handleLogin}>
              <h3>Login</h3>
              {message ? <p className="status-message status-message-warn">{message}</p> : null}
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="form-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="form-input"
              />
              <button type="submit" className="form-submit-btn form-submit-btn-warn">
                Entra
              </button>
            </form>
          ) : (
            <form className="auth-card auth-card-page" onSubmit={handleRegister}>
              <h3>Registrazione</h3>
              {message ? <p className="status-message status-message-warn">{message}</p> : null}
              <input
                type="text"
                placeholder="Nome"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="form-input"
              />
              <input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="form-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="form-input"
              />
              <button type="submit" className="form-submit-btn form-submit-btn-warn">
                Registrati
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="top-nav top-nav-sticky">
        <h2 className="brand-title brand-button" onClick={() => scrollToSection("home")}>
          Biblioteca
        </h2>

        <div className="top-nav-links">
          <span className="nav-link" onClick={() => scrollToSection("home")}>
            Home
          </span>
          <span className="nav-link" onClick={() => scrollToSection("catalogo")}>
            Catalogo Libri
          </span>
          <span className="nav-link" onClick={() => scrollToSection("prestiti")}>
            Prestiti
          </span>
        </div>

        {currentUser ? (
          <div className="user-chip">
            <span>{currentUser.name}</span>
            <span className="points-chip">Punti: {currentUser.points}</span>
            <button className="small-action-btn" onClick={handleLogout}>Logout</button>
          </div>
        ) : null}
      </nav>

      <section id="home" className="hero-section hero-section-dark">
        <h1 className="hero-title hero-title-large hero-title-white">
          Benvenuto in Biblioteca
        </h1>

        <p className="hero-subtitle">
          Scopri il piacere della lettura. Visualizza i libri disponibili,
          aggiungi nuovi titoli e gestisci i prestiti in modo semplice.
        </p>

        <div className="hero-actions">
          <button onClick={() => scrollToSection("catalogo")} className="hero-btn hero-btn-primary hero-btn-gap">
            Scopri il catalogo
          </button>

          <button onClick={() => scrollToSection("gestione-libri")} className="hero-btn hero-btn-dark">
            Gestione libri
          </button>
        </div>
      </section>

      <section className="how-section">
        <h2 className="section-heading">Come funziona</h2>

        <div className="how-grid">
          <div className="info-card info-card-strong">
            <h3>1. Visualizza</h3>
            <p>Guarda tutti i libri disponibili nel catalogo.</p>
          </div>

          <div className="info-card info-card-strong">
            <h3>2. Aggiungi</h3>
            <p>Inserisci nuovi libri direttamente dal form.</p>
          </div>

          <div className="info-card info-card-strong">
            <h3>3. Noleggia</h3>
            <p>Prenota un libro con un click e aggiorna le copie.</p>
          </div>
        </div>
      </section>

      <section id="gestione-libri" className="form-section">
        <form onSubmit={handleAddBook} className="book-form-card">
          <h2 className="form-heading">Aggiungi Libro</h2>

          {message && <p className="status-message status-message-warn">{message}</p>}

          <input
            type="text"
            placeholder="Titolo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />

          <input
            type="text"
            placeholder="Autore"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="form-input"
          />

          <input
            type="number"
            placeholder="Copie totali"
            value={totalCopies}
            onChange={(e) => setTotalCopies(e.target.value)}
            className="form-input"
          />

          <button type="submit" className="form-submit-btn form-submit-btn-warn">
            Aggiungi libro
          </button>
        </form>
      </section>

      <section id="catalogo" className="catalog-section">
        <h2 className="section-heading">Catalogo Libri</h2>

        <div className="catalog-grid">
          {books.map((book) => (
            <div key={book.id} className="catalog-card">
              <h3 className="catalog-card-title">{book.title}</h3>

              <p>
                <b>Autore:</b> {book.author}
              </p>

              <p>
                <b>Copie totali:</b> {book.totalCopies}
              </p>

              <p>
                <b>Disponibili:</b> {book.available}
              </p>

              <button
                onClick={() => handleBorrow(book.id)}
                disabled={book.available <= 0}
                className="borrow-button borrow-button-warn"
              >
                {book.available > 0 ? "Prendi in prestito" : "Non disponibile"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="prestiti" className="loans-section">
        <h2 className="section-heading loans-heading">Prestiti</h2>

        <div className="loans-panel">
          {!currentUser ? (
            <p className="loans-text">Fai login per vedere e gestire i tuoi prestiti.</p>
          ) : openLoans.length === 0 ? (
            <p className="loans-text">Nessun prestito aperto al momento.</p>
          ) : (
            <div className="loan-list">
              {openLoans.map((loan) => (
                <div key={loan.id} className="loan-row">
                  <div>
                    <p className="loan-title">{loan.book?.title ?? `Libro #${loan.bookId}`}</p>
                    <p className="loan-meta">Scadenza: {new Date(loan.endDate).toLocaleDateString()}</p>
                  </div>
                  <button className="small-action-btn" onClick={() => handleReturnLoan(loan.id)}>
                    Restituisci
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
