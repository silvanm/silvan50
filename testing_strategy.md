# Testing Strategy for Triangle Slideshow Package

## 1. Processor Module Tests

- **Unit Tests**:
  - Test `process_image` with mocked triangler module to verify parameter passing
  - Test error handling for invalid image paths and corrupted images
  - Test output file path generation when none is specified

- **Integration Tests**:
  - Test processing of actual small test images (with dimensions < 100px)
  - Verify JSON output structure matches expected triangle format
  - Test processing multiple images with `process_images`
  - Test various file extensions handling

- **Mock Strategy**:
  - Mock triangler.convert to avoid actual processing in unit tests
  - Create small fixture images for integration tests

## 2. Transition Module Tests

- **Unit Tests**:
  - Test `calculate_centroid` with known triangle coordinates
  - Test `calculate_cost_matrix` with small sets of triangles
  - Test `create_transition` with controlled triangle sets

- **Property-Based Tests**:
  - Verify symmetry properties of the cost matrix
  - Test with randomly generated triangle sets of varying sizes

- **Performance Tests**:
  - Benchmark memory usage for large triangle sets
  - Test scaling behavior with increasing triangle counts

## 3. Slideshow Module Tests

- **Unit Tests**:
  - Test `Slideshow` class initialization
  - Test `add_slide` with various inputs
  - Test `add_transition` with mocked transition creation
  - Test `auto_create_transitions` with sequential and all-pairs modes
  - Test serialization with `to_dict` and deserialization with `from_dict`

- **Integration Tests**:
  - Test saving and loading slideshows from disk
  - Test end-to-end slideshow creation with small triangle sets

- **Edge Cases**:
  - Test with empty slides
  - Test with single-slide slideshows
  - Test with very large slideshows

## 4. Main Script Tests

- **System Tests**:
  - Test command-line argument parsing
  - Test main workflow with small test images
  - Test output file generation

- **Mock/Patch Strategy**:
  - Patch argparse for CLI testing
  - Patch the module functions for isolated testing
  - Inject test fixtures instead of processing real images

## 5. Test Fixtures and Helpers

- Create small test images
- Create pre-computed triangle representations
- Create sample slideshows of varying complexity
- Provide helper functions for triangle comparison

## 6. Test Prerequisites

- Ensure all dependencies are installed (NumPy, SciPy, scikit-image)
- Ensure triangler module is available in the Python path during tests

## 7. CI Integration

- Run unit tests on every commit
- Run integration tests on pull requests
- Add performance tests as regular benchmarks
- Generate test coverage reports 