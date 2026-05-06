import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RaidService } from '../../../core/services/raid.service';
import { PersonnageDTO } from '../../../core/models/raid.model';
import { RaidCompositionComponent } from './raid-composition.component';

describe('RaidCompositionComponent', () => {
  let component: RaidCompositionComponent;
  let fixture: ComponentFixture<RaidCompositionComponent>;

  const authServiceMock = {
    authStatus$: of({ officer: false })
  };

  const raidServiceMock = {
    exportFormattedCompo: jasmine.createSpy('exportFormattedCompo').and.returnValue(of(void 0))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaidCompositionComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: RaidService, useValue: raidServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RaidCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('counts only one missing raid buff for a single hunter fallback', () => {
    component.group1 = [buildCharacter('Legolas', 'Chasseur', 'Survie', 'DPS')];
    component.group2 = [];

    (component as any).refreshCoverageSummaries();

    const coveredBuffs = Object.values(component.coveredRaidBuffs).filter((count) => count > 0);
    expect(coveredBuffs.length).toBe(1);
  });

  it('shows the recommended pet when a hunter fills a missing buff', () => {
    component.group1 = [
      buildCharacter('Varian', 'Guerrier', 'Arme', 'DPS'),
      buildCharacter('Legolas', 'Chasseur', 'Survie', 'DPS')
    ];
    component.group2 = [];

    (component as any).refreshCoverageSummaries();

    expect(component.coveredRaidBuffs['Chance de critique']).toBe(1);
    expect(component.getBuffProviders('Chance de critique')).toEqual([
      'Legolas - Chasseur Survie - Pet conseille: Loup'
    ]);
  });
});

function buildCharacter(nom: string, classe: string, specialisation: string, role: string): PersonnageDTO {
  return {
    id: Math.floor(Math.random() * 100000),
    nom,
    classe,
    specialisation,
    role,
    main: true
  };
}
