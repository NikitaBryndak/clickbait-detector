import os
import sys
import joblib
import warnings
import pytest
from backend.api.utils import predict_clickbait
from backend.api.main import translate_to_english
warnings.filterwarnings("ignore")

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

sys.path.insert(0, parent_dir)

@pytest.fixture(scope="session")
def model():
    """Load model once for all tests"""
    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'models', 'combined.joblib')
    model_path = os.path.abspath(MODEL_PATH)

    if not os.path.exists(model_path):
        pytest.fail(f"Model file not found: {model_path}")

    model_components = joblib.load(model_path)
    assert model_components is not None, "Failed to load model components"
    return model_components


def test_model_loading(model):
    """Test that the model loads successfully"""
    assert model is not None, "Model should not be None"


def test_english_clickbait_predictions(model):
    """Test English clickbait predictions with various titles"""
    test_titles = [
        ("Google Cloud Associate Cloud Engineer Course - Pass the Exam!", 0),
        ("Scientists discover new method for treating cancer", 0),
        ("You Won't Believe What Happened Next!", 1),
    ]

    for title, expected_class in test_titles:
        result = predict_clickbait(title, model)

        # Verify result structure
        assert isinstance(result, dict), "Result should be a dictionary"
        assert 'prediction' in result, "Result should contain 'prediction' key"
        assert 'combined_probability' in result, "Result should contain 'combined_probability' key"

        # Verify prediction values
        assert result['prediction'] in [0, 1], "Prediction should be 0 or 1"
        assert 0 <= result['combined_probability'] <= 1, "Probability should be between 0 and 1"

        # Verify expected prediction
        assert result['prediction'] == expected_class, f"Title '{title}' should be predicted as {expected_class}"


def test_english_prediction_result_structure(model):
    """Test that prediction results have correct structure"""
    title = "This is a test title"
    result = predict_clickbait(title, model)

    assert isinstance(result, dict)
    assert 'prediction' in result
    assert 'combined_probability' in result
    assert isinstance(result['prediction'], (int, float))
    assert isinstance(result['combined_probability'], (int, float))


def test_non_english_translation_and_prediction(model):
    """Test non-English translation and prediction"""
    non_english_titles = [
        "Este es un título increíble",      # spanish
        "Ceci est un titre incroyable",     # french
        "यह एक अविश्वसनीय शीर्षक है"       # hindi
    ]

    for title in non_english_titles:
        # Test translation
        translated = translate_to_english(title)
        assert translated is not None, f"Translation failed for: {title}"
        assert len(translated) > 0, f"Translated text should not be empty for: {title}"
        assert isinstance(translated, str), "Translated text should be a string"

        # Test prediction on translated text
        result = predict_clickbait(translated, model)
        assert isinstance(result, dict), "Result should be a dictionary"
        assert 'prediction' in result, "Result should contain 'prediction' key"
        assert 'combined_probability' in result, "Result should contain 'combined_probability' key"
        assert 0 <= result['combined_probability'] <= 1, "Probability should be between 0 and 1"


def test_translation_produces_valid_predictions(model):
    """Test that translations can be used for predictions"""
    non_english_title = "¡No creerás lo que pasó después!"

    # Translate to english
    translated = translate_to_english(non_english_title)

    # Get prediction on translated text
    result = predict_clickbait(translated, model)

    # Verify we get valid results
    assert 'prediction' in result
    assert 'combined_probability' in result
    assert result['prediction'] in [0, 1]
    assert 0 <= result['combined_probability'] <= 1
