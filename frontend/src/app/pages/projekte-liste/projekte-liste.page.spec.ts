import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiService, Project } from '../../services/api.service';
import { ProjekteListePage } from './projekte-liste.page';

const PROJEKTE: Project[] = [
  {
    id: 1,
    teamId: 1,
    titel: 'Dezentrale Wahl-App',
    beschreibung: 'Abstimmungssystem',
    praesentiertAm: '2026-06-12',
    Team: { id: 1, name: 'Team Blockchain', klasse: '4AHITL' },
  },
  {
    id: 2,
    teamId: 2,
    titel: 'Autonomer Greifarm',
    praesentiertAm: null,
    Team: { id: 2, name: 'Team RoboArm', klasse: '4AHITL' },
  },
];

describe('ProjekteListePage', () => {
  let component: ProjekteListePage;
  let fixture: ComponentFixture<ProjekteListePage>;
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjekteListePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ApiService, useValue: { getProjects: () => of(PROJEKTE) } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjekteListePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('wird erzeugt', () => {
    expect(component).toBeTruthy();
  });

  it('lädt die Projekte vom Backend', () => {
    expect(component.projekte().length).toBe(2);
    expect(component.laedt()).toBe(false);
    expect(component.fehler()).toBeNull();
  });

  it('filtert nach Titel, unabhängig von Groß- und Kleinschreibung', () => {
    component.sucheAendern('greifarm');
    expect(component.gefiltert().length).toBe(1);
    expect(component.gefiltert()[0].titel).toBe('Autonomer Greifarm');
  });

  it('filtert auch nach Teamname', () => {
    component.sucheAendern('blockchain');
    expect(component.gefiltert().length).toBe(1);
    expect(component.gefiltert()[0].id).toBe(1);
  });

  it('zählt nur die Teams der angezeigten Projekte', () => {
    expect(component.anzahlTeams()).toBe(2);
    component.sucheAendern('blockchain');
    expect(component.anzahlTeams()).toBe(1);
  });

  it('formatiert das Datum als TT.MM.JJJJ und kennzeichnet fehlende Termine', () => {
    expect(component.datum(PROJEKTE[0])).toBe('12.06.2026');
    expect(component.datum(PROJEKTE[1])).toBe('noch nicht terminiert');
  });

  it('navigiert beim Öffnen zur Detailseite', () => {
    component.oeffne(PROJEKTE[1]);
    expect(router.navigate).toHaveBeenCalledWith(['/projekte', 2]);
  });
});
