import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Project, apiFehlerText } from '../../services/api.service';

/**
 * Listenansicht aller Projekte inklusive Team.
 *
 * Der Zustand liegt in Signals. Angular 22 arbeitet ohne zone.js (zoneless),
 * deshalb löst nur eine Signal-Änderung die Aktualisierung der Ansicht aus.
 * Mit normalen Klasseneigenschaften bliebe die Seite nach dem HTTP-Aufruf im
 * Ladezustand stehen.
 */
@Component({
  selector: 'app-projekte-liste',
  templateUrl: './projekte-liste.page.html',
  styleUrls: ['./projekte-liste.page.scss'],
  standalone: false,
})
export class ProjekteListePage implements OnInit {
  readonly projekte = signal<Project[]>([]);
  readonly laedt = signal(true);
  readonly fehler = signal<string | null>(null);
  readonly suche = signal('');

  /** Clientseitiger Filter über Projekttitel und Teamname. */
  readonly gefiltert = computed<Project[]>(() => {
    const begriff = this.suche().trim().toLowerCase();
    if (!begriff) return this.projekte();

    return this.projekte().filter(
      (p) =>
        p.titel.toLowerCase().includes(begriff) ||
        (p.Team?.name ?? '').toLowerCase().includes(begriff)
    );
  });

  /** Anzahl unterschiedlicher Teams in der aktuell angezeigten Liste. */
  readonly anzahlTeams = computed(() => new Set(this.gefiltert().map((p) => p.teamId)).size);

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.laden();
  }

  /** Wird auch vom ion-refresher aufgerufen. */
  laden(ereignis?: CustomEvent) {
    this.fehler.set(null);
    if (!ereignis) this.laedt.set(true);

    this.api.getProjects().subscribe({
      next: (daten) => {
        this.projekte.set(daten);
        this.laedt.set(false);
        this.beendeRefresh(ereignis);
      },
      error: (fehler) => {
        this.fehler.set(apiFehlerText(fehler));
        this.laedt.set(false);
        this.beendeRefresh(ereignis);
      },
    });
  }

  private beendeRefresh(ereignis?: CustomEvent) {
    const refresher = ereignis?.target as HTMLIonRefresherElement | undefined;
    refresher?.complete();
  }

  sucheAendern(wert: string | null | undefined) {
    this.suche.set(wert ?? '');
  }

  oeffne(projekt: Project) {
    this.router.navigate(['/projekte', projekt.id]);
  }

  /** ISO-Datum der Präsentation als lesbares Datum. */
  datum(projekt: Project): string {
    if (!projekt.praesentiertAm) return 'noch nicht terminiert';
    const [jahr, monat, tag] = projekt.praesentiertAm.split('-');
    return `${tag}.${monat}.${jahr}`;
  }
}
