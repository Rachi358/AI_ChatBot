from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/', endpoint="index")
def index():
    # Renders templates/index.html
    return render_template('index.html')
