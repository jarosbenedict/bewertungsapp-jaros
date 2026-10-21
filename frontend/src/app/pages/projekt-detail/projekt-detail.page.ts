import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  ApiService,
  Evaluation,
  Project,
  ProjektAuswertung,
  KriteriumAuswertung,
  apiFehlerText,
} from '../../services/api.service';

/**
 * Detailansicht eines Projekts mit Auswertung pro Kriterium und allen
 * bisherigen Einzelbewertungen.
 *
 * Wie in der Liste liegen die Daten in Signals, weil Angular 22 zoneless
 * arbeitet und nur Signal-Änderungen die Ansicht aktualisieren.
 */
@Component({
  selector: 'app-projekt-detail',
  templateUrl: './projekt-detail.page.html',
  styleUrls: ['./projekt-detail.page.scss'],
  standalone: false,
})
export class ProjektDetailPage implements OnInit {
  readonly projekt = signal<Project | null>(null);
  readonly auswertung = signal<ProjektAuswertung | null>(null);
  readonly bewertungen = signal<Evaluation[]>([]);
  readonly laedt = signal(true);
  readonly fehler = signal<string | null>(null);

  /** Gesamtdurchschnitt, null wenn noch nichts bewertet wurde. */
  readonly gesamt = computed(() => this.auswertung()?.gesamt?.durchschnitt ?? null);

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.laden();
  }

  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  /**
   * Lädt Projekt, Auswertung und Bewertungen parallel. forkJoin wartet auf alle
   * drei Antworten, damit die Seite in einem Schritt vollständig aufgebaut wird.
   */
  laden(ereignis?: CustomEvent) {
    this.fehler.set(null);
    if (!ereignis) this.laedt.set(true);

    const id = this.id;
    if (!Number.isInteger(id) || id <= 0) {
      this.fehler.set('Ungültige Projekt-ID in der URL.');
      this.laedt.set(false);
      this.beendeRefresh(ereignis);
      return;
    }

    forkJoin({
      projekt: this.api.getProject(id),
      auswertung: this.api.getProjektAuswertung(id),
      bewertungen: this.api.getProjectEvaluations(id),
    }).subscribe({
      next: ({ projekt, auswertung, bewertungen }) => {
        this.projekt.set(projekt);
        this.auswertung.set(auswertung);
        this.bewertungen.set(bewertungen);
        this.laedt.set(false);
        this.beendeRefresh(ereignis);
      },
      error: (fehler) => {
        this.projekt.set(null);
        this.auswertung.set(null);
        this.bewertungen.set([]);
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

  zurueck() {
    this.location.back();
  }

  neuLaden() {
    this.laden();
  }

  /** Breite des Balkens in Prozent, 0 wenn das Kriterium unbewertet ist. */
  balkenbreite(k: KriteriumAuswertung): number {
    return k.durchschnittProzent === null ? 0 : Math.max(0, Math.min(100, k.durchschnittProzent));
  }

  datum(iso: string | null | undefined): string {
    if (!iso) return 'noch nicht terminiert';
    const [jahr, monat, tag] = iso.split('-');
    return `${tag}.${monat}.${jahr}`;
  }

  /** Initialen für das Juror-Kürzel in der Bewertungsliste. */
  initialen(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((teil) => teil[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
