(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var fig = document.getElementById('factory-arch');
  if (!fig) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Layout constants ── */
  var W = 960, H = 280;
  var NODE_W = 130, NODE_H = 44, NODE_RX = 6;

  /* ── Node definitions: id, label, cx, cy ── */
  var nodes = [
    { id: 'kafka',    label: 'Kafka',    cx: 80,  cy: 70  },
    { id: 'redis',    label: 'Redis',    cx: 300, cy: 70  },
    { id: 'airflow',  label: 'Airflow',  cx: 80,  cy: 210 },
    { id: 'dbt',      label: 'dbt',      cx: 300, cy: 210 },
    { id: 'bigquery', label: 'BigQuery', cx: 490, cy: 210 },
    { id: 'fastapi',  label: 'FastAPI',  cx: 680, cy: 140, sub: 'Platform API' },
    { id: 'flask',    label: 'Flask',    cx: 870, cy: 140 },
  ];

  /*
   * Edge paths — right-angle elbows.
   * NODE_W=130 → half=65, NODE_H=44 → half=22
   *   Kafka right=145  Redis left=235  Kafka bottom=92  Airflow top=188
   *   Airflow right=145  dbt left=235
   *   dbt right=365  BigQuery left=425
   *   Redis right=365  FastAPI left=615
   *   BigQuery right=555  FastAPI left=615
   *   FastAPI right=745  Flask left=805
   */
  var edges = [
    { id: 'e-kafka-redis',    from: 'kafka',    to: 'redis',
      d: 'M 145 70 L 235 70' },
    { id: 'e-kafka-airflow',  from: 'kafka',    to: 'airflow',
      d: 'M 80 92 L 80 188' },
    { id: 'e-airflow-dbt',    from: 'airflow',  to: 'dbt',
      d: 'M 145 210 L 235 210' },
    { id: 'e-dbt-bq',         from: 'dbt',      to: 'bigquery',
      d: 'M 365 210 L 425 210' },
    { id: 'e-redis-fastapi',  from: 'redis',    to: 'fastapi',
      d: 'M 365 70 L 510 70 L 510 140 L 615 140' },
    { id: 'e-bq-fastapi',     from: 'bigquery', to: 'fastapi',
      d: 'M 555 210 L 580 210 L 580 140 L 615 140' },
    { id: 'e-fastapi-flask',  from: 'fastapi',  to: 'flask',
      d: 'M 745 140 L 805 140' },
  ];

  /* Build adjacency map for hover highlighting */
  var nodeEdgeMap = {};
  nodes.forEach(function (n) { nodeEdgeMap[n.id] = []; });
  edges.forEach(function (e) {
    nodeEdgeMap[e.from].push(e.id);
    nodeEdgeMap[e.to].push(e.id);
  });

  /* ── Create SVG root ── */
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('role', 'img');
  svg.style.display = 'block';
  svg.style.width = '100%';

  /* ── Arrow marker ── */
  var defs = document.createElementNS(NS, 'defs');
  var marker = document.createElementNS(NS, 'marker');
  marker.id = 'jp-arrow';
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  var poly = document.createElementNS(NS, 'polygon');
  poly.setAttribute('points', '0 0, 8 3, 0 6');
  poly.setAttribute('class', 'arch-arrow');
  marker.appendChild(poly);
  defs.appendChild(marker);
  svg.appendChild(defs);

  /* ── Draw edges ── */
  var edgeEls = {};
  edges.forEach(function (e) {
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', e.d);
    path.setAttribute('marker-end', 'url(#jp-arrow)');
    path.setAttribute('class', 'arch-edge');
    path.id = e.id;
    svg.appendChild(path);
    edgeEls[e.id] = path;
  });

  /* ── Draw nodes (on top of edges) ── */
  nodes.forEach(function (n) {
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'arch-node');
    g.setAttribute('data-node', n.id);
    g.style.cursor = 'default';

    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', n.cx - NODE_W / 2);
    rect.setAttribute('y', n.cy - NODE_H / 2);
    rect.setAttribute('width', NODE_W);
    rect.setAttribute('height', NODE_H);
    rect.setAttribute('rx', NODE_RX);

    var labelY = n.sub ? n.cy - 5 : n.cy + 1;
    var txt = document.createElementNS(NS, 'text');
    txt.setAttribute('x', n.cx);
    txt.setAttribute('y', labelY);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('class', 'arch-node-label');
    txt.textContent = n.label.toUpperCase();

    g.appendChild(rect);
    g.appendChild(txt);

    if (n.sub) {
      var sub = document.createElementNS(NS, 'text');
      sub.setAttribute('x', n.cx);
      sub.setAttribute('y', n.cy + 9);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('dominant-baseline', 'middle');
      sub.setAttribute('class', 'arch-node-sublabel');
      sub.textContent = n.sub;
      g.appendChild(sub);
    }

    svg.appendChild(g);

    /* Hover: highlight connected edges */
    var connectedIds = nodeEdgeMap[n.id];

    g.addEventListener('mouseenter', function () {
      connectedIds.forEach(function (eid) {
        edgeEls[eid].classList.add('arch-edge--active');
      });
    });

    g.addEventListener('mouseleave', function () {
      connectedIds.forEach(function (eid) {
        edgeEls[eid].classList.remove('arch-edge--active');
      });
    });
  });

  /* ── Insert SVG before figcaption ── */
  var caption = fig.querySelector('figcaption');
  if (caption) {
    fig.insertBefore(svg, caption);
  } else {
    fig.appendChild(svg);
  }

  /* ── Stroke-dashoffset draw animation ── */
  if (prefersReduced) return;

  var allEdgePaths = edges.map(function (e) { return edgeEls[e.id]; });

  /* Set initial hidden state (must be after DOM insertion for getTotalLength) */
  allEdgePaths.forEach(function (path) {
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.style.transition = 'none';
  });

  if (!('IntersectionObserver' in window)) {
    /* Fallback: draw immediately */
    allEdgePaths.forEach(function (path) {
      path.style.strokeDashoffset = '0';
    });
    return;
  }

  var drawObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        allEdgePaths.forEach(function (path, i) {
          var delay = i * 80;
          var duration = 460 + i * 60;
          setTimeout(function () {
            path.style.transition =
              'stroke-dashoffset ' + duration + 'ms cubic-bezier(0.16, 1, 0.3, 1),' +
              ' opacity ' + 180 + 'ms ease,' +
              ' stroke-width ' + 180 + 'ms ease';
            path.style.strokeDashoffset = '0';
          }, delay);
        });

        drawObserver.disconnect();
      });
    },
    { threshold: 0.25 }
  );

  drawObserver.observe(fig);
})();
