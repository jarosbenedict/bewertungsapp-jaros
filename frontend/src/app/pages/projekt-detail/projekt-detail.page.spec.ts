import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';
import { ApiService, Evaluation, Project, ProjektAuswertung } from '../../services/api.service';
import { ProjektDetailPage } from './projekt-detail.page';

const PROJEKT: Project = {
  id: 1,
  teamId: 1,
  titel: 'Dezentrale Wahl-App',
  praesentiertAm: '2026-06-12',
  Team: { id: 1, name: 'Team Blockchain', klasse: '4AHITL' },
};

const AUSWERTUNG: ProjektAuswertung = {
  project: {
    id: 1,
    titel: 'Dezentrale Wahl-App',
    teamId: 1,
    team: 'Team Blockchain',
    praesentiertAm: '2026-06-12',
  },
  kriterien: [
    {
      criterionId: 1,
      kriterium: 'Inhalt',
      maxScore: 10,
      weight: 1,
      anzahlBewertungen: 2,
      durchschnitt: 8.5,
      minimum: 8,
      maximum: 9,
      durchschnittProzent: 85,
    },
    {
      criterionId: 2,
      kriterium: 'Technische Umsetzung',
      maxScore: 10,
      weight: 1.5,
      anzahlBewertungen: 0,
      durchschnitt: null,
      minimum: null,
      maximum: null,
      durchschnittProzent: null,
    },
  ],
  gesamt: {
    durchschnitt: 8.64,
    summeGewicht: 2.5,
    anzahlKriterien: 2,
    anzahlBewerteterKriterien: 1,
    summeBewertungen: 2,
  },
};

const BEWERTUNGEN: Evaluation[] = [
  {
    id: 1,
    projectId: 1,
    criterionId: 1,
    jurorId: 1,
    score: 8,
    comment: 'Konzept klar erklärt',
    Criterion: { id: 1, name: 'Inhalt', maxScore: 10, weight: 1 },
    Juror: { id: 1, name: 'M. Huber', email: 'm.huber@schule.at' },
  },
];

describe('ProjektDetailPage', () => {
  let component: ProjektDetailPage;
  let fixture: ComponentFixture<ProjektDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjektDetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: Location, useValue: { back: vi.fn() } },
        {
          provide: ApiService,
          useValue: {
            getProject: () => of(PROJEKT),
            getProjektAuswertung: () => of(AUSWERTUNG),
            getProjectEvaluations: () => of(BEWERTUNGEN),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjektDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('wird erzeugt', () => {
    expect(component).toBeTruthy();
  });

  it('lädt Projekt, Auswertung und Bewertungen parallel', () => {
    expect(component.projekt()?.titel).toBe('Dezentrale Wahl-App');
    expect(component.auswertung()?.kriterien.length).toBe(2);
    expect(component.bewertungen().length).toBe(1);
    expect(component.laedt()).toBe(false);
  });

  it('übernimmt den gewichteten Gesamtdurchschnitt aus der Auswertung', () => {
    expect(component.gesamt()).toBe(8.64);
  });

  it('rechnet den Durchschnitt in eine Balkenbreite um', () => {
    expect(component.balkenbreite(AUSWERTUNG.kriterien[0])).toBe(85);
  });

  it('lässt den Balken bei unbewerteten Kriterien leer', () => {
    expect(component.balkenbreite(AUSWERTUNG.kriterien[1])).toBe(0);
  });

  it('bildet Initialen für das Juror-Kürzel', () => {
    expect(component.initialen('M. Huber')).toBe('MH');
    expect(component.initialen(undefined)).toBe('?');
  });

  it('formatiert das Präsentationsdatum', () => {
    expect(component.datum('2026-06-12')).toBe('12.06.2026');
    expect(component.datum(null)).toBe('noch nicht terminiert');
  });
});
