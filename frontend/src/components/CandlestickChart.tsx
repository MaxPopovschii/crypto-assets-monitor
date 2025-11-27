import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts';
import { OHLCData } from '../types';
import { useWebSocketStore } from '../store/websocket.store';
import './CandlestickChart.css';

interface CandlestickChartProps {
  symbol: string;
  onClose: () => void;
}

export function CandlestickChart({ symbol, onClose }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<{ value: number; percentage: number } | null>(null);
  const [highLow, setHighLow] = useState<{ high: number; low: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { prices } = useWebSocketStore();

  console.log('CandlestickChart rendered for symbol:', symbol);

  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return; // Non ricreare se esiste già

    // Create chart with professional styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { 
          color: 'transparent'
        },
        textColor: '#9ca3af',
        fontSize: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      },
      grid: {
        vertLines: { 
          color: 'rgba(255, 255, 255, 0.05)',
          style: 1,
          visible: true 
        },
        horzLines: { 
          color: 'rgba(255, 255, 255, 0.05)',
          style: 1,
          visible: true
        }
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: 3,
          labelBackgroundColor: '#6366f1'
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: 3,
          labelBackgroundColor: '#6366f1'
        }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    // Candlestick series with professional colors
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01
      }
    });

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#6366f1',
      priceFormat: {
        type: 'volume'
      },
      priceScaleId: ''
    });

    // Live price line
    const lineSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#3b82f6',
      crosshairMarkerBackgroundColor: '#1e40af',
      title: 'Live'
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    lineSeriesRef.current = lineSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        lineSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Reset last candle quando cambia timeframe
    lastCandleRef.current = null;
    setError(null); // Reset errori
    loadChartData();
  }, [symbol, timeframe]);

  // Real-time price updates from WebSocket
  useEffect(() => {
    const price = prices.get(symbol);
    if (price && candlestickSeriesRef.current && lineSeriesRef.current) {
      const now = Math.floor(Date.now() / 1000);
      setCurrentPrice(price.currentPrice);

      // Update line series with current price
      lineSeriesRef.current.update({
        time: now as any,
        value: price.currentPrice
      });

      // Update current candle in real-time
      if (lastCandleRef.current && timeframe) {
        const timeframeMs = getTimeframeMilliseconds(timeframe);
        const candleStartTime = Math.floor(now / (timeframeMs / 1000)) * (timeframeMs / 1000);
        
        // If we're in the same candle period, update it
        if (lastCandleRef.current.time === candleStartTime) {
          const updatedCandle: CandlestickData = {
            time: candleStartTime as any,
            open: lastCandleRef.current.open,
            high: Math.max(lastCandleRef.current.high, price.currentPrice),
            low: Math.min(lastCandleRef.current.low, price.currentPrice),
            close: price.currentPrice
          };
          candlestickSeriesRef.current.update(updatedCandle);
          lastCandleRef.current = updatedCandle; // Aggiorna ref senza re-render
        } else {
          // New candle period - create new candle
          const newCandle: CandlestickData = {
            time: candleStartTime as any,
            open: price.currentPrice,
            high: price.currentPrice,
            low: price.currentPrice,
            close: price.currentPrice
          };
          candlestickSeriesRef.current.update(newCandle);
          lastCandleRef.current = newCandle; // Aggiorna ref senza re-render
        }
      }
    }
  }, [prices, symbol, timeframe]);

  const getTimeframeMilliseconds = (tf: string): number => {
    const map: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return map[tf] || 60 * 60 * 1000;
  };

  const loadChartData = async () => {
    if (!candlestickSeriesRef.current || !chartRef.current) {
      console.log('Chart not ready, skipping loadChartData');
      return;
    }

    setLoading(true);
    
    try {
      const to = Date.now();
      const from = to - (timeframe === '1d' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);

      const response = await fetch(
        `/api/market/history/${symbol}?timeframe=${timeframe}&from=${new Date(from).toISOString()}&to=${new Date(to).toISOString()}`
      );
      const data = await response.json();

      // Check se il componente è ancora montato
      if (!candlestickSeriesRef.current) return;

      if (data.success && data.data.length > 0) {
        const candleData: CandlestickData[] = data.data
          .map((d: OHLCData) => {
            // Converti time a Unix timestamp se è un oggetto Date
            const timestamp = typeof d.time === 'number' 
              ? d.time 
              : Math.floor(new Date(d.time).getTime() / 1000);
            
            return {
              time: timestamp as any,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close
            };
          })
          .sort((a: any, b: any) => (a.time as number) - (b.time as number)); // Ordina per tempo crescente

        // Generate volume data
        const volumeData: HistogramData[] = candleData.map(candle => {
          const isUp = candle.close >= candle.open;
          const volume = Math.random() * 1000000; // Mock volume for now
          
          return {
            time: candle.time,
            value: volume,
            color: isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
          };
        });

        candlestickSeriesRef.current.setData(candleData);
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volumeData);
        }
        chartRef.current?.timeScale().fitContent();
        
        // Store last candle for real-time updates and calculate price change
        if (candleData.length > 0) {
          lastCandleRef.current = candleData[candleData.length - 1];
          const firstCandle = candleData[0];
          const lastCandle = candleData[candleData.length - 1];
          const change = lastCandle.close - firstCandle.open;
          const changePercent = (change / firstCandle.open) * 100;
          setPriceChange({ value: change, percentage: changePercent });
          
          // Calculate high and low
          const high = Math.max(...candleData.map(c => c.high));
          const low = Math.min(...candleData.map(c => c.low));
          setHighLow({ high, low });
        }
      } else {
        // Fallback: genera dati mock se API non disponibile
        console.log('API not available, generating mock data');
        generateMockData();
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
      setError('Failed to load chart data');
      // Fallback: genera dati mock
      try {
        generateMockData();
      } catch (mockError) {
        console.error('Failed to generate mock data:', mockError);
        setError('Failed to display chart');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    if (!candlestickSeriesRef.current) return;

    const basePrice = prices.get(symbol)?.currentPrice || 50000;
    const now = Math.floor(Date.now() / 1000);
    const timeframeSeconds = getTimeframeMilliseconds(timeframe) / 1000;
    const numCandles = 50;

    const mockData: CandlestickData[] = [];
    const volumeData: HistogramData[] = [];
    
    for (let i = numCandles; i >= 0; i--) {
      const time = now - (i * timeframeSeconds);
      const randomness = (Math.random() - 0.5) * basePrice * 0.02; // ±2%
      const open = basePrice + randomness;
      const close = open + (Math.random() - 0.5) * basePrice * 0.01;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
      const isUp = close >= open;
      const volume = Math.random() * 1000000;

      mockData.push({
        time: time as any,
        open,
        high,
        low,
        close
      });

      volumeData.push({
        time: time as any,
        value: volume,
        color: isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
      });
    }

    // Ordina per tempo crescente (importante!)
    mockData.sort((a, b) => (a.time as number) - (b.time as number));
    volumeData.sort((a, b) => (a.time as number) - (b.time as number));

    candlestickSeriesRef.current.setData(mockData);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData);
    }
    chartRef.current?.timeScale().fitContent();
    
    if (mockData.length > 0) {
      lastCandleRef.current = mockData[mockData.length - 1];
      const firstCandle = mockData[0];
      const lastCandle = mockData[mockData.length - 1];
      const change = lastCandle.close - firstCandle.open;
      const changePercent = (change / firstCandle.open) * 100;
      setPriceChange({ value: change, percentage: changePercent });
      
      // Calculate high and low
      const high = Math.max(...mockData.map(c => c.high));
      const low = Math.min(...mockData.map(c => c.low));
      setHighLow({ high, low });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{symbol}</h2>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    LIVE
                  </span>
                </div>
                {currentPrice && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold text-white">
                      ${currentPrice.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                    {priceChange && (
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                        priceChange.value >= 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        <span>{priceChange.value >= 0 ? '↗' : '↘'}</span>
                        <span>
                          {Math.abs(priceChange.percentage).toFixed(2)}%
                        </span>
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span>Real-time</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl font-bold transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
            >
              ×
            </button>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex gap-2">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`timeframe-button px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart Legend - NUOVO */}
        <div className="px-6 py-3 bg-gray-900/80 border-b border-gray-700/30 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-8 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-300">
                <span className="font-semibold">Verde</span> = Prezzo sale (Rialzo)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-8 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-300">
                <span className="font-semibold">Rosso</span> = Prezzo scende (Ribasso)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-8 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-300">
                <span className="font-semibold">Linea blu</span> = Prezzo attuale live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500/50"></div>
              <span className="text-sm text-gray-300">
                <span className="font-semibold">Volume</span> = Quantità scambiata
              </span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {highLow && (
          <div className="px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/30">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-gray-400 font-semibold">MASSIMO 24H</span>
                </div>
                <span className="text-lg font-bold text-green-400">
                  ${highLow.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-gray-400 font-semibold">MINIMO 24H</span>
                </div>
                <span className="text-lg font-bold text-red-400">
                  ${highLow.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {highLow.high > 0 && currentPrice && (
                <>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-400 font-semibold">POSIZIONE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                          style={{ 
                            width: `${((currentPrice - highLow.low) / (highLow.high - highLow.low)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-400 min-w-[50px] text-right">
                        {(((currentPrice - highLow.low) / (highLow.high - highLow.low)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <span className="text-xs text-gray-400 font-semibold">VOLATILITÀ</span>
                    </div>
                    <span className="text-lg font-bold text-purple-400">
                      {(((highLow.high - highLow.low) / highLow.low) * 100).toFixed(2)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Chart Container */}
        <div className="p-6 bg-gradient-to-b from-gray-900 to-black relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="text-white font-semibold">Loading chart data...</div>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10 rounded-lg">
              <div className="text-center bg-gray-800 p-8 rounded-xl border border-red-500/30">
                <div className="text-red-400 mb-4 text-lg font-semibold">{error}</div>
                <button
                  onClick={() => {
                    setError(null);
                    loadChartData();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          <div 
            ref={chartContainerRef} 
            className="rounded-lg overflow-hidden shadow-inner"
            style={{ background: 'linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(0,0,0,1) 100%)' }}
          />
        </div>
      </div>
    </div>
  );
}
