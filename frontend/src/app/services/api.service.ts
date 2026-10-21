import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Typen entsprechen 1:1 den Sequelize-Modellen aus Einheit 3.
 * Optionale Felder sind solche, die der Server selbst setzt (id, Zeitstempel)
 * oder die nur bei eingebundenen Assoziationen mitkommen (Team, Evaluations).
 */

export interface Team {
  id?: number;
  name: string;
  klasse: string;
  createdAt?: string;
  updatedAt?: string;
  Members?: Member[];
  Projects?: Project[];
}

export interface Member {
  id?: number;
  teamId: number;
  vorname: string;
  nachname: string;
  Team?: Team;
}

export interface Project {
  id?: number;
  teamId: number;
  titel: string;
  beschreibung?: string | null;
  praesentiertAm?: string | null;
  Team?: Team;
  Evaluations?: Evaluation[];
}

export interface Criterion {
  id?: number;
  name: string;
  maxScore: number;
  weight: number;
}

export interface Juror {
  id?: number;
  name: string;
  email: string;
}

export interface Evaluation {
  id?: number;
  projectId: number;
  criterionId: number;
  jurorId: number;
  score: number;
  comment?: string | null;
  Project?: Project;
  Criterion?: Criterion;
  Juror?: Juror;
}

/** Eine Zeile der Auswertung, wie sie GET /projects/:id/auswertung liefert. */
export interface KriteriumAuswertung {
  criterionId: number;
  kriterium: string;
  maxScore: number;
  weight: number;
  anzahlBewertungen: number;
  durchschnitt: number | null;
  minimum: number | null;
  maximum: number | null;
  durchschnittProzent: number | null;
}

export interface ProjektAuswertung {
  project: {
    id: number;
    titel: string;
    teamId: number;
    team: string | null;
    praesentiertAm: string | null;
  };
  kriterien: KriteriumAuswertung[];
  gesamt: {
    durchschnitt: number | null;
    summeGewicht: number;
    anzahlKriterien: number;
    anzahlBewerteterKriterien: number;
    summeBewertungen: number;
  };
}

/** Eine Zeile von GET /evaluations/auswertung (alle Projekte). */
export interface AuswertungZeile {
  projectId: number;
  projekt: string;
  criterionId: number;
  kriterium: string;
  maxScore: number;
  weight: number;
  anzahlBewertungen: number;
  durchschnitt: number;
}

/**
 * Wandelt eine HttpErrorResponse in einen Satz um, den man im Frontend
 * anzeigen kann. Das Backend liefert Fehler als { error: "...", details: {...} }.
 */
export function apiFehlerText(fehler: unknown): string {
  if (fehler instanceof HttpErrorResponse) {
    if (fehler.status === 0) {
      return 'Backend nicht erreichbar. Läuft der Server auf ' + environment.apiUrl + '?';
    }

    const serverMeldung = fehler.error && typeof fehler.error === 'object' ? fehler.error.error : null;
    if (serverMeldung) {
      return `Fehler ${fehler.status}: ${serverMeldung}`;
    }
    return `Fehler ${fehler.status}: ${fehler.statusText || 'Unbekannter Fehler'}`;
  }

  return 'Unerwarteter Fehler beim Laden der Daten.';
}

/**
 * Zentraler Zugriff auf das Backend aus Einheit 4.
 * Kein Bestandteil der Komponenten greift direkt auf HttpClient zu.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---------------------------------------------------------------- Teams

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.url}/teams`);
  }

  getTeam(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.url}/teams/${id}`);
  }

  getTeamMembers(id: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.url}/teams/${id}/members`);
  }

  getTeamProjects(id: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.url}/teams/${id}/projects`);
  }

  createTeam(team: Team): Observable<Team> {
    return this.http.post<Team>(`${this.url}/teams`, team);
  }

  updateTeam(id: number, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${this.url}/teams/${id}`, team);
  }

  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/teams/${id}`);
  }

  // -------------------------------------------------------------- Members

  getMembers(teamId?: number): Observable<Member[]> {
    const params = teamId === undefined ? undefined : new HttpParams().set('teamId', teamId);
    return this.http.get<Member[]>(`${this.url}/members`, { params });
  }

  getMember(id: number): Observable<Member> {
    return this.http.get<Member>(`${this.url}/members/${id}`);
  }

  createMember(member: Member): Observable<Member> {
    return this.http.post<Member>(`${this.url}/members`, member);
  }

  updateMember(id: number, member: Partial<Member>): Observable<Member> {
    return this.http.put<Member>(`${this.url}/members/${id}`, member);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/members/${id}`);
  }

  // ------------------------------------------------------------- Projects

  getProjects(teamId?: number): Observable<Project[]> {
    const params = teamId === undefined ? undefined : new HttpParams().set('teamId', teamId);
    return this.http.get<Project[]>(`${this.url}/projects`, { params });
  }

  /** Ein Projekt inklusive Team und allen Bewertungen (mit Kriterium und Juror). */
  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.url}/projects/${id}`);
  }

  getProjectEvaluations(id: number): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.url}/projects/${id}/evaluations`);
  }

  /** Durchschnitt der Punkte pro Kriterium, gewichteter Gesamtdurchschnitt. */
  getProjektAuswertung(id: number): Observable<ProjektAuswertung> {
    return this.http.get<ProjektAuswertung>(`${this.url}/projects/${id}/auswertung`);
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.url}/projects`, project);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.url}/projects/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/projects/${id}`);
  }

  // ------------------------------------------------------------ Criteria

  getCriteria(): Observable<Criterion[]> {
    return this.http.get<Criterion[]>(`${this.url}/criteria`);
  }

  createCriterion(criterion: Criterion): Observable<Criterion> {
    return this.http.post<Criterion>(`${this.url}/criteria`, criterion);
  }

  updateCriterion(id: number, criterion: Partial<Criterion>): Observable<Criterion> {
    return this.http.put<Criterion>(`${this.url}/criteria/${id}`, criterion);
  }

  deleteCriterion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/criteria/${id}`);
  }

  // -------------------------------------------------------------- Jurors

  getJurors(): Observable<Juror[]> {
    return this.http.get<Juror[]>(`${this.url}/jurors`);
  }

  createJuror(juror: Juror): Observable<Juror> {
    return this.http.post<Juror>(`${this.url}/jurors`, juror);
  }

  updateJuror(id: number, juror: Partial<Juror>): Observable<Juror> {
    return this.http.put<Juror>(`${this.url}/jurors/${id}`, juror);
  }

  deleteJuror(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/jurors/${id}`);
  }

  // --------------------------------------------------------- Evaluations

  getEvaluations(filter?: {
    projectId?: number;
    criterionId?: number;
    jurorId?: number;
  }): Observable<Evaluation[]> {
    let params = new HttpParams();
    if (filter?.projectId !== undefined) params = params.set('projectId', filter.projectId);
    if (filter?.criterionId !== undefined) params = params.set('criterionId', filter.criterionId);
    if (filter?.jurorId !== undefined) params = params.set('jurorId', filter.jurorId);

    return this.http.get<Evaluation[]>(`${this.url}/evaluations`, { params });
  }

  getEvaluation(id: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.url}/evaluations/${id}`);
  }

  createEvaluation(evaluation: Evaluation): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.url}/evaluations`, evaluation);
  }

  updateEvaluation(id: number, evaluation: Partial<Evaluation>): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.url}/evaluations/${id}`, evaluation);
  }

  deleteEvaluation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/evaluations/${id}`);
  }

  /** Auswertung über alle Projekte, gruppiert nach Projekt und Kriterium. */
  getGesamtauswertung(projectId?: number): Observable<AuswertungZeile[]> {
    const params = projectId === undefined ? undefined : new HttpParams().set('projectId', projectId);
    return this.http.get<AuswertungZeile[]>(`${this.url}/evaluations/auswertung`, { params });
  }
}
