"use client";

import { FieldIntake } from "@/lib/types";
import {
  ALT_FIELDS,
  PREVIOUS_CROP_OPTIONS,
  RESIDUAL_N_OPTIONS,
  STATES,
  WEATHER_OPTIONS,
} from "@/lib/demo-data";

type Props = {
  intake: FieldIntake;
  onChange: (patch: Partial<FieldIntake>) => void;
  onLoadScenario: (idx: number) => void;
  scenarioIndex: number;
};

export function IntakePanel({
  intake,
  onChange,
  onLoadScenario,
  scenarioIndex,
}: Props) {
  return (
    <section className="card p-6 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800">
            Field intake
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Defaults are seeded for the demo — edit any input and the
            recommendation updates in real time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALT_FIELDS.map((f, i) => {
            const active = i === scenarioIndex;
            return (
              <button
                key={f.fieldName}
                type="button"
                onClick={() => onLoadScenario(i)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-pressed={active}
              >
                {f.fieldName.split("—")[0].trim()}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Field name">
          <input
            className="field-input"
            value={intake.fieldName}
            onChange={(e) => onChange({ fieldName: e.target.value })}
          />
        </Field>
        <Field label="County">
          <input
            className="field-input"
            value={intake.county}
            onChange={(e) => onChange({ county: e.target.value })}
          />
        </Field>
        <Field label="State">
          <select
            className="field-input"
            value={intake.state}
            onChange={(e) =>
              onChange({ state: e.target.value as FieldIntake["state"] })
            }
          >
            {STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Acres">
          <input
            type="number"
            min={0}
            className="field-input"
            value={intake.acres}
            onChange={(e) =>
              onChange({ acres: Number(e.target.value) || 0 })
            }
          />
        </Field>
        <Field label="Previous crop">
          <select
            className="field-input"
            value={intake.previousCrop}
            onChange={(e) =>
              onChange({
                previousCrop: e.target.value as FieldIntake["previousCrop"],
              })
            }
          >
            {PREVIOUS_CROP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Soil type">
          <input
            className="field-input"
            value={intake.soilType}
            onChange={(e) => onChange({ soilType: e.target.value })}
          />
        </Field>
        <Field
          label="Your current planned N rate"
          hint="lb N / acre — the flat rate you'd apply today"
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              className="field-input"
              value={intake.currentNRate}
              onChange={(e) =>
                onChange({ currentNRate: Number(e.target.value) || 0 })
              }
            />
            <span className="text-xs text-slate-500">lb / ac</span>
          </div>
        </Field>
        <Field label="Corn price" hint="$ / bushel at harvest">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="field-input"
              value={intake.cornPrice}
              onChange={(e) =>
                onChange({ cornPrice: Number(e.target.value) || 0 })
              }
            />
            <span className="text-xs text-slate-500">/ bu</span>
          </div>
        </Field>
        <Field label="Nitrogen price" hint="$ / lb of actual N">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="field-input"
              value={intake.nitrogenPrice}
              onChange={(e) =>
                onChange({ nitrogenPrice: Number(e.target.value) || 0 })
              }
            />
            <span className="text-xs text-slate-500">/ lb</span>
          </div>
        </Field>
      </div>

      <div className="mt-6">
        <div className="field-label">Residual soil N indicator</div>
        <div className="grid grid-cols-3 gap-2">
          {RESIDUAL_N_OPTIONS.map((opt) => {
            const active = intake.residualN === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ residualN: opt.value })}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-slate-700 bg-slate-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                aria-pressed={active}
              >
                <div className="text-sm font-semibold text-slate-800">
                  {opt.label}
                </div>
                <div className="text-[11px] text-slate-500">{opt.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="field-label">Seasonal scenario</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {WEATHER_OPTIONS.map((opt) => {
            const active = intake.weather === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ weather: opt.value })}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-slate-700 bg-slate-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                aria-pressed={active}
              >
                <div className="text-sm font-semibold text-slate-800">
                  {opt.label}
                </div>
                <div className="text-[11px] text-slate-500">{opt.hint}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
