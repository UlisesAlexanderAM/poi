import { connect } from 'react-redux'
import React from 'react'
import { Button, Label, Tooltip, OverlayTrigger } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { get } from 'lodash'

const __ = window.i18n.main.__.bind(window.i18n.main)

const fatiguedLabel = <Label bsStyle='danger' className='airbase-state-label'>{__('Fatigued')}</Label>
const emptyLabel = <Label bsStyle='warning' className='airbase-state-label'>{__('Empty slot')}</Label>
const relocateLabel = <Label bsStyle='warning' className='airbase-state-label'>{__('Relocating')}</Label>
const resupplyLabel = <Label bsStyle='warning' className='airbase-state-label'>{__('Resupply needed')}</Label>
const noActionLabel = <Label bsStyle='warning' className='airbase-state-label'>{__('No action')}</Label>
const readyLabel = <Label bsStyle='success' className='airbase-state-label'>{__('Ready')}</Label>

export const LandbaseButton = connect(state => ({
  sortieStatus: get(state, 'sortie.sortieStatus', []),
  airbase: get(state, 'info.airbase', []),
  mapareas: get(state, 'const.$mapareas', {}),
}))(({ fleetId, activeFleetId, onClick, disabled, airbase, sortieStatus, mapareas, isMini }) => {
  const airbaseProps = airbase.map(a => a.api_area_id)
    .sort((a, b) => a - b)
    .filter((a, i, arr) => a != arr[i - 1])
    .map(i => ({
      mapId: i,
      needSupply: airbase.filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_count !== s.api_max_count).reduce((a, b) => a || b, false))
        .reduce((a, b) => a || b, false),
      // 0: 未配属あり, 1: 配属済み, >1: 配置転換中あり
      squardState: airbase.filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_state).reduce((a, b) => a * b, 1)).reduce((a, b) => a * b, 1),
      // 1: 通常, >1: 黄疲労・赤疲労あり
      squardCond: airbase.filter(a => a.api_area_id === i)
        .map(a => a.api_plane_info.map(s => s.api_cond || 1).reduce((a, b) => a * b, 1)).reduce((a, b) => a * b, 1),
      noAction: airbase.filter(a => a.api_area_id === i)
        .map(a => a.api_action_kind !== 1 && a.api_action_kind !== 2).reduce((a, b) => a || b, false),
    }))
  const needSupply = airbaseProps.map(a => a.needSupply).reduce((a, b) => a || b, false)
  const squardState = airbaseProps.map(a => a.squardState).reduce((a, b) => a * b, 1)
  const squardCond = airbaseProps.map(a => a.squardCond).reduce((a, b) => a * b, 1)
  const noAction = airbaseProps.map(a => a.noAction).reduce((a, b) => a || b, false)
  const sortie = sortieStatus.reduce((a, b) => a || b, false)
  const bsStyle = (() => {
    if (sortie) {
      return 'default'
    } else if (squardCond > 1) {
      return 'danger'
    } else if (squardState !== 1 || needSupply) {
      return 'warning'
    } else if (noAction) {
      return 'info'
    } else {
      return 'success'
    }
  })()
  const propTooltip = <Tooltip id={isMini ? 'airbase-tooltip-mini' : 'airbase-tooltip'}>
    {
      airbaseProps.map((airbase, i) => {
        const { mapId, needSupply, squardState, squardCond, noAction } = airbase
        return (
          <div key={i}>
            <div>[{mapId}] {window.i18n.resources.__((mapareas[mapId] || {}).api_name)}</div>
            { squardCond > 1 && fatiguedLabel }
            { squardState < 1 && emptyLabel }
            { squardState > 1 && relocateLabel }
            { needSupply && resupplyLabel }
            { noAction && noActionLabel }
            {
              squardCond === 1 &&
              squardState === 1 &&
              !needSupply &&
              !noAction &&
              readyLabel
            }
          </div>
        )
      })
    }
  </Tooltip>
  return (
    <div>
      <OverlayTrigger placement='bottom' overlay={propTooltip}>
        <Button
          bsSize={isMini ? 'xsmall' : 'small'}
          bsStyle={bsStyle}
          onClick={onClick}
          disabled={disabled}
          className={fleetId == activeFleetId ? 'active' : ''}
        >
          <FontAwesome name='plane' />
        </Button>
      </OverlayTrigger>
    </div>
  )
})
