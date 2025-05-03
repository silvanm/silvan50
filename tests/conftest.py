"""
Pytest configuration file.

This file contains configuration and fixtures for pytest.
"""

import os
import sys
import pytest

# Add the project root directory to the Python path
# This ensures that the triangle_slideshow package can be imported in tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# You can add any global pytest fixtures here
@pytest.fixture(scope="session")
def numpy_random_seed():
    """
    Fixture to set a fixed random seed for numpy to ensure reproducible tests.
    """
    import numpy as np

    np.random.seed(42)
    return 42
