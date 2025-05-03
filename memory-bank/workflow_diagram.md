# Triangle Slideshow Workflow Diagram

This diagram illustrates the complete workflow of the triangle slideshow system, showing how images are processed, transformed into triangle representations, and transitions are created between them.

```mermaid
flowchart TD
    %% Main input and components
    images[Input Images] --> create[create_slideshow.py]
    
    %% Main processor subgraph
    subgraph triangle_slideshow
        processor[processor.py] --> slideshow[slideshow.py]
        slideshow --> transition[transition.py]
        transition --> slideshow
    end
    
    %% Flow connections
    create --> processor
    
    %% Processing steps
    processor -- "Process images\nwith triangler" --> triangles[Triangle Representations]
    triangles --> slides[Slides Collection]
    slides -- "Add to\nslideshow" --> slideshow
    
    %% Transition modes
    subgraph "Transition Modes"
        sequential[Sequential\n1→2→3] 
        roundrobin[Round Robin\n1→2→3→1]
    end
    
    %% Transition creation
    slideshow -- "default" --> sequential
    slideshow -- "--round-robin" --> roundrobin
    
    %% Transition algorithms
    subgraph "Hungarian Algorithm"
        centroids[Calculate Centroids]
        costmatrix[Generate Cost Matrix]
        assignment[Linear Assignment]
        pairings[Create Pairings]
        
        centroids --> costmatrix --> assignment --> pairings
    end
    
    transition --> centroids
    
    %% Output handling
    slideshow --> json[Slideshow JSON]
    json --> output[Output File]
    
    %% Optional frontend visualization
    output -- "Load JSON" --> frontend[Frontend Visualization]
    
    %% Frontend rendering
    subgraph "Frontend (React+SVG)"
        load[Load Transitions]
        render[Render Triangles]
        animate[Animate with GSAP]
        
        load --> render --> animate
    end
    
    frontend --> load
    
    %% Styling
    classDef primary fill:#9370DB,stroke:#333,stroke-width:2px
    classDef secondary fill:#87CEFA,stroke:#333,stroke-width:1px
    classDef highlight fill:#FF7F50,stroke:#333,stroke-width:2px
    
    class create,processor,slideshow,transition primary
    class sequential secondary
    class roundrobin highlight
    class centroids,costmatrix,assignment,pairings secondary
    class render,animate secondary
```

## Key Components

1. **Entry Point**: `create_slideshow.py` as the main CLI interface
2. **Core Package Structure**: The modular `triangle_slideshow` package with its three main components
3. **Processing Flow**: From input images to triangle representations to slides
4. **Transition Options**: Two simple modes available:
   - **Sequential (default)**: Creates transitions between consecutive slides (1→2→3)
   - **Round-Robin**: Creates a circular pattern including transition from last to first (1→2→3→1)
5. **Hungarian Algorithm**: The key steps in matching triangles between slides
6. **Output Generation**: Creating the slideshow JSON file
7. **Frontend Integration**: Optional visualization with React and SVG

The round-robin transition feature is highlighted as the newest addition, showing how it creates circular transitions that loop back from the last slide to the first. 