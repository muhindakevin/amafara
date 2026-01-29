/**
 * WebRTC polyfills for browser compatibility
 * This ensures stream-browserify is available before simple-peer loads
 */

// Set up global and process first
if (typeof window !== 'undefined') {
  // Ensure global is defined
  if (typeof global === 'undefined') {
    window.global = window
    var global = window
  }

  // Ensure process is defined (minimal)
  if (typeof process === 'undefined') {
    window.process = {
      env: {},
      version: 'v16.0.0',
      versions: { node: '16.0.0' },
      browser: true,
      nextTick: (fn) => setTimeout(fn, 0)
    }
    var process = window.process
  }
}

// Import stream-browserify synchronously to ensure it's available
// This must be done at module level, not inside a function
import * as streamModule from 'stream-browserify'

// Get the actual stream exports
const stream = streamModule.default || streamModule

// Make Stream and all stream classes available globally for simple-peer
// This is critical - simple-peer needs these to be available when it loads
if (typeof window !== 'undefined') {
  // Get Stream base class - try multiple ways
  const StreamClass = stream.Stream || stream.default?.Stream || stream
  
  // Expose Stream base class with proper prototype
  if (StreamClass) {
    // Ensure Stream.call is available (needed by simple-peer)
    if (typeof StreamClass.call === 'undefined') {
      // Add call method if it doesn't exist
      StreamClass.call = function(context, ...args) {
        return StreamClass.apply(context, args)
      }
    }
    
    window.Stream = StreamClass
    if (typeof global !== 'undefined') {
      global.Stream = StreamClass
    }
  }
  
  // Expose Readable with proper prototype
  if (stream.Readable) {
    window.Readable = stream.Readable
    if (typeof global !== 'undefined') {
      global.Readable = stream.Readable
    }
  }
  
  // Expose Writable
  if (stream.Writable) {
    window.Writable = stream.Writable
    if (typeof global !== 'undefined') {
      global.Writable = stream.Writable
    }
  }
  
  // Expose Duplex (most important for simple-peer)
  if (stream.Duplex) {
    // Ensure Duplex has proper inheritance from Stream
    if (StreamClass && stream.Duplex.prototype) {
      // Make sure Duplex can call Stream
      if (typeof stream.Duplex.call === 'undefined') {
        stream.Duplex.call = function(context, ...args) {
          return StreamClass.call(context, ...args)
        }
      }
    }
    
    window.Duplex = stream.Duplex
    if (typeof global !== 'undefined') {
      global.Duplex = stream.Duplex
    }
  }
  
  // Expose Transform
  if (stream.Transform) {
    window.Transform = stream.Transform
    if (typeof global !== 'undefined') {
      global.Transform = stream.Transform
    }
  }
  
  // Also expose PassThrough
  if (stream.PassThrough) {
    window.PassThrough = stream.PassThrough
    if (typeof global !== 'undefined') {
      global.PassThrough = stream.PassThrough
    }
  }
  
  // Debug: Log what we've exposed
  console.log('[WebRTC Polyfill] Stream classes exposed:', {
    Stream: !!window.Stream,
    StreamCall: typeof window.Stream?.call,
    Readable: !!window.Readable,
    Writable: !!window.Writable,
    Duplex: !!window.Duplex,
    DuplexCall: typeof window.Duplex?.call,
    Transform: !!window.Transform
  })
}

export default stream

