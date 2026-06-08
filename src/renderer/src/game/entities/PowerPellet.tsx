import type { CollectibleState } from '../engine/types'

interface PowerPelletProps {
  readonly collectible: CollectibleState
  readonly tileSize: number
}

export function PowerPellet({ collectible, tileSize }: PowerPelletProps): React.JSX.Element {
  const cx = collectible.position.col * tileSize + tileSize / 2
  const cy = collectible.position.row * tileSize + tileSize / 2
  const logoSize = 307
  const scale = (tileSize * 0.58) / logoSize

  return (
    <g className="power-qgis" transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <circle className="power-qgis-halo" cx="0" cy="0" r={logoSize / 2} />
      <g transform={`translate(${-logoSize / 2} ${-logoSize / 2})`}>
        <g className="power-qgis-art">
          <g transform="matrix(1,0,0,1,-649.265,-381.766)">
            <path
              className="power-qgis-ring"
              d="M869.024,671.106C848.72,681.114 825.886,686.734 801.749,686.734C717.591,686.734 649.265,618.408 649.265,534.25C649.265,450.092 717.591,381.766 801.749,381.766C885.907,381.766 954.233,450.092 954.233,534.25C954.233,558.126 948.734,580.727 938.93,600.863L896.147,558.658C898.163,550.853 899.234,542.675 899.234,534.25C899.234,480.447 855.552,436.765 801.749,436.765C747.946,436.765 704.264,480.447 704.264,534.25C704.264,588.053 747.946,631.735 801.749,631.735C810.293,631.735 818.582,630.633 826.481,628.564L869.024,671.106Z"
            />
            <path
              className="power-qgis-tail"
              d="M820.798,509.168L955.758,642.306L955.758,685.254L908.784,685.254L775.788,552.258L775.788,509.271L820.798,509.168Z"
            />
            <path
              className="power-qgis-cube-front"
              d="M813.912,590.16L775.788,552.258L775.788,509.271L820.798,509.168L857.44,545.128L813.912,545.128L813.912,590.16Z"
            />
            <path
              className="power-qgis-cube-side"
              d="M832.653,609.123L832.653,564.438L876.75,564.438L857.44,545.128L813.912,545.128L813.912,590.16L832.653,609.123Z"
            />
          </g>
        </g>
      </g>
    </g>
  )
}
