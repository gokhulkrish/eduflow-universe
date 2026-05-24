import { NextRequest, NextResponse } from 'next/server';
import { savePreset, loadPresets } from '../../../../src/core/registered-students/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get('institutionId');
  const userId = searchParams.get('userId') || undefined;

  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId required' }, { status: 400 });
  }

  const presets = await loadPresets(institutionId, userId);
  return NextResponse.json({ presets });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { institutionId, userId, presetName, viewMode, compact, wrap, freezeFirst, freezeActions, bandedRows, focusMode, groupBy, controlBreak, visibleColumns, sortState, filterState, reportState } = body;

  if (!institutionId || !presetName || !viewMode) {
    return NextResponse.json({ error: 'institutionId, presetName, viewMode required' }, { status: 400 });
  }

  const id = await savePreset({
    institutionId,
    userId: userId ?? null,
    presetName,
    viewMode,
    compact: compact ?? false,
    wrap: wrap ?? false,
    freezeFirst: freezeFirst ?? false,
    freezeActions: freezeActions ?? false,
    bandedRows: bandedRows ?? false,
    focusMode: focusMode ?? false,
    groupBy: groupBy ?? null,
    controlBreak: controlBreak ?? null,
    visibleColumns: visibleColumns ?? null,
    sortState: sortState ?? null,
    filterState: filterState ?? null,
    reportState: reportState ?? null,
  });

  return NextResponse.json({ id });
}
